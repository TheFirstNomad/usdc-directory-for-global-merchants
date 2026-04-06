// Logo component — renders the site PNG logo from /public/usdc-directory-logo.png
interface LogoProps {
  className?: string;
  size?: number;
}

const Logo = ({ className = "", size = 36 }: LogoProps) => (
  <img
    src="/usdc-directory-logo.png"
    alt="USDC Directory"
    width={size}
    height={size}
    className={`rounded-lg object-contain ${className}`}
  />
);

export default Logo;
