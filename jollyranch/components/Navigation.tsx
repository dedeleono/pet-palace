import {FC} from "react";

const navigationItems = [
    {
        id: "shill-city-capital",
        title: "Shill City Capital",
        href: "https://staking.shill-city.com/"
    },
    {
        id: "pet-palace",
        title: "Pet Palace",
        href: "https://pets.shill-city.com/"
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
            className="bg-neutral/60 block lg:fixed z-200 inset-0 lg:top lg:left lg:right-auto lg:w-[17.5rem] lg:overflow-y-auto">
            <div className="flex items-center">
                <div className="p-2 lg:p-4">
                    <img alt="Sea Shanties" src="/logo.png" className="w-8 lg:w-16 " />
                </div>
                <div className="font-jangkuy text-xs lg:text-xl flex-auto text-secondary-content">
                    Sea<br/>
                    Shanties
                </div>
                <div className="grow lg:hidden text-right p-2 pt-1 pb-1">
                    <div className="dropdown dropdown-sm dropdown-end">
                        <label tabIndex={0} className="btn btn-circle btn-ghost text-secondary-content">
                            <svg className="swap-off fill-current" xmlns="http://www.w3.org/2000/svg" width="25" height="25"
                                 viewBox="0 0 512 512">
                                <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z"/>
                            </svg>
                        </label>
                        <ul tabIndex={0} className="p-2 shadow menu dropdown-content bg-base-100 rounded-box w-52">
                            {navigationItems.map((item) => (
                                <a
                                    key={item.id}
                                    href={item.href}
                                    className={`text-secondary-content ${activeId === item.id ? 'text-yellow' : ''}`}>
                                    {item.title}
                                </a>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            <div className="hidden lg:block ">
                {navigationItems.map((item) => (
                    <a
                        key={item.id}
                        href={item.href}
                        className={`relative font-scratchy text-5xl p-4 block ${activeId === item.id ? 'text-yellow border-l-4 border-yellow' : 'border-l-4 border-transparent text-secondary-content  hover:text-yellow'}`}>
                        {item.title}
                    </a>
                ))}
            </div>
        </div>
    );
}

export default Navigation;
