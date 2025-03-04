
import { useState, useEffect } from 'react';
import ProfileMenu from './ProfileMenu';

type HeaderProps = {
  activeTab: string;
};

const Header = ({ activeTab }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-md shadow-sm py-2'
          : 'bg-white py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary md:text-2xl">Finanças Pessoais</h1>
            <p className="text-sm text-gray-500">{activeTab}</p>
          </div>
          
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
