import {FC} from "react";

const headerItems = [
    {
        id: "shill-city-capital",
        logo: "",
        title: "",
        description: ""
    },
    {
        id: "pet-palace",
        logo: "/logo-pet-palace.png",
        title: "Catch, breed and stake your pets",
        description: "The pet palace is a popular place for the citizens of Shill City to take their pets for some R&R. It's a place full of beauty and wonderful sights. The area is overpopulated with strange creatures looking to breed with the pets. We need your help to capture them all before they start causing trouble."
    },
    {
        id: "poseidon-lp",
        logo: "",
        title: "",
        description: ""
    }
];
interface HeaderProps {
    activeId: string;
}
/**
 * Component that contains the global menu
 */
const Header: FC<HeaderProps>  = ({activeId}) => {
    const activeHeader = headerItems.find(item => item.id === activeId);
    return (
        <div className="md:flex items-center pb-6">
            <img src={activeHeader.logo} className="w-32 lg:w-48 pr-6" />
            <div className="flex-grow pt-4 md:pt-0">
                <div className="font-jangkuy text-xs lg:text-2xl flex-auto text-secondary-content">
                    {activeHeader.title}
                </div>
                <p className="max-w-4xl text-sm md:text-base">{activeHeader.description}</p>
            </div>
        </div>
    );
}

export default Header;
