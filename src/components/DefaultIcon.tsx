import Image, {ImageProps} from 'next/image';


export const defaultLogoUrl = '/default.png';
type iLogo = Omit<ImageProps, 'src' | 'alt'>;
const Logo = (props : iLogo) => {
  return <Image {...props} src={defaultLogoUrl} alt={'default'} />
}

export default Logo;
