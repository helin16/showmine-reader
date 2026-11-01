export const COVER_IMAGE_CLASS = 'video-cover-image';

const PLAY_LABEL = 'Play video 播放视频';
const FAILED_MESSAGE = 'Video Not Available 视频无法播放';
const PLAY_ICON =
  '<svg viewBox="0 0 68 48" aria-hidden="true"><rect width="68" height="48" rx="12" fill="#f00"/><path d="M27 14v20l18-10z" fill="#fff"/></svg>';
// A browser can wait forever for a dead address, so the reader is told. Playing later removes the message.
const PLAY_TIMEOUT_MS = 15000;

// "100%" says nothing about the shape, only plain numbers and pixels do.
const getStoredSize = (size: string | null) =>
  /^[\d.]+(px)?$/.test(`${size}`) ? parseFloat(`${size}`) : 0;

const setShape = (wrapper: HTMLElement, width: number, height: number) => {
  wrapper.style.paddingTop = `${(height / width) * 100}%`;
};

const coverVideo = (video: HTMLVideoElement, signal: AbortSignal) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-cover';
  const width = getStoredSize(video.style.width || video.getAttribute('width'));
  const height = getStoredSize(
    video.style.height || video.getAttribute('height')
  );
  const hasStoredShape = width > 0 && height > 0;
  if (hasStoredShape) {
    setShape(wrapper, width, height);
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', PLAY_LABEL);
  button.innerHTML = PLAY_ICON;

  const poster = video.getAttribute('poster');
  if (poster) {
    const cover = document.createElement('img');
    cover.className = COVER_IMAGE_CLASS;
    cover.alt = '';
    // The dark background of the wrapper is the placeholder.
    cover.onerror = () => cover.remove();
    cover.onload = () => {
      if (!hasStoredShape) {
        setShape(wrapper, cover.naturalWidth, cover.naturalHeight);
      }
    };
    cover.src = poster;
    button.prepend(cover);
  }

  const message = document.createElement('div');
  message.className = 'video-cover-message';
  message.setAttribute('role', 'alert');
  message.textContent = FAILED_MESSAGE;

  let timer: ReturnType<typeof setTimeout>;
  const stopWaiting = () => clearTimeout(timer);
  const showFailure = () => {
    stopWaiting();
    wrapper.append(message);
  };

  const play = () => {
    button.remove();
    video.controls = true;
    video.muted = false;
    video.focus();
    // A failed <source> reports to itself, not the video, and play() then never settles.
    video.addEventListener(
      'error',
      e => {
        if ((e.target as Element).nextElementSibling?.tagName !== 'SOURCE') {
          showFailure();
        }
      },
      { capture: true, signal }
    );
    video.addEventListener(
      'timeupdate',
      () => {
        stopWaiting();
        message.remove();
      },
      { signal }
    );
    video.addEventListener('pause', stopWaiting, { signal });
    timer = setTimeout(showFailure, PLAY_TIMEOUT_MS);
    // Chrome stops reporting a failed <source> once the video has been moved, until it reloads.
    video.load();
    // WeChat may return nothing, and pausing a video that is still starting rejects with AbortError.
    video.play()?.catch(err => {
      if (err?.name !== 'AbortError') {
        showFailure();
      }
    });
  };
  button.addEventListener('click', play);

  video.controls = false;
  video.before(wrapper);
  wrapper.append(video, button);

  return () => {
    stopWaiting();
    video.pause(); // a video removed from the page keeps playing
    video.controls = true;
    wrapper.replaceWith(video);
  };
};

// Runs after render, so the server HTML stays a native video for readers without scripts.
const setup = (content: HTMLElement) => {
  const controller = new AbortController();
  const { signal } = controller;
  content.addEventListener(
    'play',
    e =>
      content.querySelectorAll('video').forEach(video => {
        if (video !== e.target) {
          video.pause();
        }
      }),
    { capture: true, signal }
  );
  const restoreVideos = Array.from(content.querySelectorAll('video'))
    // Tapped before this ran, so it is already the native player.
    .filter(video => video.paused && video.currentTime === 0)
    .map(video => coverVideo(video, signal));
  return () => {
    controller.abort();
    restoreVideos.forEach(restore => restore());
  };
};

const VideoCoverService = {
  setup
};

export default VideoCoverService;
