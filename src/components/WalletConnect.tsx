import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export const WalletConnect = () => {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  const truncated = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  return (
    <Button
      variant={isConnected ? "outline" : "default"}
      size="sm"
      onClick={() => open()}
      className="gap-2"
    >
      <Wallet className="h-4 w-4" />
      {isConnected ? truncated : "Connect Wallet"}
    </Button>
  );
};
