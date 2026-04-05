interface LogoProps {
  className?: string;
  size?: number;
}

const Logo = ({ className = "", size = 36 }: LogoProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    fill="none"
    width={size}
    height={size}
    className={className}
  >
    <defs>
      <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0052D4" />
        <stop offset="50%" stopColor="#008888" />
        <stop offset="100%" stopColor="#00C957" />
      </linearGradient>
    </defs>
    <g stroke="url(#brandGrad)" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 226 53 A 180 180 0 0 0 226 407" strokeWidth="24" />
      <path d="M 286 53 A 180 180 0 0 1 286 407" strokeWidth="24" />
      <line x1="256" y1="50" x2="256" y2="86" strokeWidth="24" />
      <line x1="256" y1="374" x2="256" y2="410" strokeWidth="24" />
      <path d="M 140 440 L 372 440" strokeWidth="36" />
      <line x1="256" y1="400" x2="256" y2="440" strokeWidth="36" />
      <path d="M 134 110 Q 210 230 134 350" strokeWidth="16" />
      <path d="M 378 110 Q 302 230 378 350" strokeWidth="16" />
      <path d="M 96 150 Q 256 80 416 150" strokeWidth="12" />
      <path d="M 96 310 Q 256 380 416 310" strokeWidth="12" />
      <polyline points="96,230 120,230 136,246" strokeWidth="5" />
      <polyline points="106,180 126,180 138,192" strokeWidth="5" />
      <polyline points="106,280 126,280 138,268" strokeWidth="5" />
      <polyline points="416,230 392,230 376,246" strokeWidth="5" />
      <polyline points="406,180 386,180 374,192" strokeWidth="5" />
      <polyline points="406,280 386,280 374,268" strokeWidth="5" />
    </g>
    <g fill="url(#brandGrad)">
      <circle cx="136" cy="246" r="6" />
      <circle cx="138" cy="192" r="6" />
      <circle cx="138" cy="268" r="6" />
      <circle cx="376" cy="246" r="6" />
      <circle cx="374" cy="192" r="6" />
      <circle cx="374" cy="268" r="6" />
    </g>
    <g stroke="url(#brandGrad)" fill="none" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 300 170 C 300 120, 212 120, 212 170 C 212 220, 300 240, 300 290 C 300 340, 212 340, 212 290" />
      <line x1="256" y1="110" x2="256" y2="350" />
    </g>
  </svg>
);

export default Logo;
