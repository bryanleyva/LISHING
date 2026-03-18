'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';

interface NavbarProps {
    userRole?: string;
    userName?: string | null;
    userCargo?: string;
    userPhoto?: string;
}

export default function Navbar({ userRole, userName, userCargo, userPhoto }: NavbarProps) {
    const pathname = usePathname();

    const isHR = userCargo?.trim().toUpperCase() === 'RECURSOS HUMANOS';

    const navItems = [
        { name: 'Inicio', path: '/' },
        { name: 'Leads', path: '/leads' },
        { name: 'Deals', path: '/deals' },
        { name: 'Linker', path: '/linker' },
        { name: 'Reporte', path: '/reporte' },
    ].filter(item => {
        if (isHR) {
            return item.name === 'Inicio' || item.name === 'Reporte';
        }
        return true;
    });

    return (
        <header style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            height: '84px',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 20px',
        }}>
            <style>{`
                .nav-container {
                    background: rgba(10, 15, 29, 0.7);
                    backdrop-filter: blur(12px) saturate(180%);
                    -webkit-backdrop-filter: blur(12px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    width: 100%;
                    max-width: 1200px;
                    height: 100%;
                    display: flex;
                    alignItems: center;
                    padding: 0 24px;
                    justify-content: space-between;
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
                    pointer-events: auto;
                    animation: navSlideDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                @keyframes navSlideDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .nav-links {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .nav-item {
                    color: rgba(255, 255, 255, 0.6);
                    text-decoration: none;
                    font-size: 0.9rem;
                    font-weight: 600;
                    padding: 8px 16px;
                    border-radius: 12px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    letter-spacing: 0.02em;
                }

                .nav-item:hover {
                    color: white;
                    background: rgba(255, 255, 255, 0.05);
                    transform: translateY(-1px);
                }

                .nav-item.active {
                    color: white;
                    background: rgba(99, 102, 241, 0.15);
                    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.3);
                }

                .nav-item.active::after {
                    content: '';
                    position: absolute;
                    bottom: 6px;
                    left: 20%;
                    right: 20%;
                    height: 2px;
                    background: #6366f1;
                    border-radius: 2px;
                    box-shadow: 0 0 8px #6366f1;
                }

                .logo-section {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                }

                .logo-section:hover {
                    transform: scale(1.02);
                }

                .logo-box {
                    width: 34px;
                    height: 34px;
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    color: white;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                }

                .logo-text {
                    font-weight: 800;
                    font-size: 1.1rem;
                    color: white;
                    letter-spacing: 0.05em;
                }

                .logo-accent {
                    color: #6366f1;
                }
            `}</style>

            <div className="nav-container">
                {/* Logo Section */}
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <div className="logo-section">
                        <div className="logo-box">R</div>
                        <span className="logo-text">
                            LISHING<span className="logo-accent">.SYS</span>
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="nav-links">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserMenu
                        name={userName}
                        role={userRole}
                        cargo={userCargo}
                        photo={userPhoto}
                    />
                </div>
            </div>
        </header>
    );
}
