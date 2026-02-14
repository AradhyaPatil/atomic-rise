import { NavLink } from "react-router-dom";
import { Home, Wallet, BarChart3, Trophy, User } from "lucide-react";
import "./BottomNav.css";

const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/vault", icon: Wallet, label: "Vault" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/challenges", icon: Trophy, label: "Challenges" },
    { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                    }
                    end={item.to === "/"}
                >
                    <item.icon />
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
