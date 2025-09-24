import Image from "next/image";

const ItamLogo = ({ 
  variant = "black", 
  width = 32, 
  height = 32, 
  className = "" 
}) => {
  const logoSrc = variant === "white" ? "/itam-logo-white.svg" : "/itam-logo.svg";
  
  return (
    <Image
      src={logoSrc}
      alt="ITAM Logo"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
};

export default ItamLogo;
