import React, {FC} from "react";
import WalletMultiButtonStyled from "./shared/WalletMultiButtonStyled";

const navigationItems = [
    {
        id: "home",
        title: "Home",
        href: "https://shill-city.com/"
    },
    {
        id: "shill-city-capital",
        title: "Shanties",
        href: "https://staking.shill-city.com/"
    },
    {
        id: "pet-palace",
        title: "Pets",
        href: "https://pets.shill-city.com/"
    },
    {
        id: "shill-city-citizen",
        title: "Citizens",
        href: "https://citizens.shill-city.com/"
    },
    {
        id: "old-atlantis",
        title: "Old Atlantis",
        href: "https://game.shill-city.com/",
    },
    {
        id: "poseidon-lp",
        title: "Poseidon LP",
        href: "https://lp.shill-city.com/"
    }
];
interface NavigationProps {
    activeId: string;
}
/**
 * Component that contains the global menu
 */
const Navigation: FC<NavigationProps>  = ({activeId}) => {

    return (
        <div
            className="bg-neutral/80 pl-4 block fixed flex z-100 inset-0 bottom-auto md:h-20 backdrop-blur-sm"
            style={{zIndex:998}}
        >
            <div className="flex lg:basis-1/6 xl:lg:basis-1/4 items-center">
                <a
                    href="https://shill-city.com"
                    className="py-2 md:py-0 pr-4"
                >
                    <img alt="Sea Shanties" src="/logo.png" className="w-8 md:w-12 lg:w-10 xl:w-14 " />
                </a>
                <a
                    href="https://shill-city.com"
                    className="font-jangkuy text-xs lg:text-sm xl:text-xl flex-auto text-secondary-content pr-4 leading-none hidden lg:flex" style={{lineHeight:'initial'}}
                >
                    Sea<br />Shanties
                </a>
            </div>
            <div className="flex sm:flex-grow md:basis-1/2 gap-3 md:gap-6 xl:gap-10 items-center md:flex-grow lg:place-content-center">
                {navigationItems.map((item) => (
                    <a
                        key={item.id}
                        href={item.href}
                        className={`relative indicator whitespace-nowrap flex items-center h-full font-scratchy text-2xl md:text-4xl ${activeId === item.id ? 'text-yellow border-b-4 border-yellow' : 'text-secondary-content  hover:text-yellow'}`}>
                        {item.title}
                    </a>
                ))}
            </div>
            <div className="lg:basis-1/4  items-center place-content-end pr-4 hidden sm:flex">
                <a href="https://discord.com/invite/AA66Ayk5Dz" target="_blank" rel="noopener noreferrer">
                    <img src="/images/discord.svg" className="w-4 md:w-6 m-1 md:m-2" />
                </a>
                <a href="https://twitter.com/SeaShantiesSol" target="_blank" rel="noopener noreferrer">
                    <img src="/images/twitter.svg" className="w-4 md:w-6 m-1 md:m-2" />
                </a>
                <a href="https://magiceden.io/creators/sea_shanties" target="_blank" rel="noopener noreferrer">
                    <img src="/images/me.svg" className="w-4 md:w-7 m-1 md:m-2" />
                </a>
                <WalletMultiButtonStyled className="!btn-xs !w-[130px] ml-2 md:!btn-md md:!w-[170px]" />
            </div>
        </div>
    );
}

export default Navigation;
