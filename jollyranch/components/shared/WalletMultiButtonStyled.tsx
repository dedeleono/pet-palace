import {FC} from "react";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";

interface WalletMultiButtonStyledProps {
    className?: string;
}

const WalletMultiButtonStyled: FC<WalletMultiButtonStyledProps> = ({className}) => {
    return (
        <WalletMultiButton
            startIcon={<svg stroke="#fff" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em"
                            width="1em" xmlns="http://www.w3.org/2000/svg">
                <path stroke="currentColor" fill="currentColor"
                      d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9a1.5 1.5 0 0 1 1.432-1.499L12.136.326zM5.562 3H13V1.78a.5.5 0 0 0-.621-.484L5.562 3zM1.5 4a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-13z"/>
            </svg>}
            className={`wallet-adapter-button-trigger flex items-center w-[190px] !rounded-full ${className}`}
            style={{padding:20}}
        />)
}

export default WalletMultiButtonStyled;
