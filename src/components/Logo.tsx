import Image, {ImageProps} from 'next/image';


type iLogo = Omit<ImageProps, 'src' | 'alt'>;
const Logo = ({width, height, ...props} : iLogo) => {
  return <Image {...props} src={'/logo.png'} alt={'logo'} width={width || 200} height={height || 200}/>
}

export default Logo;
