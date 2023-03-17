import Image, {ImageProps} from 'next/image';


type iLogo = Omit<ImageProps, 'src' | 'alt'>;
const Logo = (props : iLogo) => {
  return <Image {...props} src={'/logo.png'} alt={'logo'} />
}

export default Logo;
