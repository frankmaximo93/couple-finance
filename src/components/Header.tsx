
import { Fragment } from 'react';

type HeaderProps = {
  activeTab: string;
};

const Header = ({ activeTab }: HeaderProps) => {
  return (
    <div className="w-full py-6 px-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-b-3xl shadow-lg">
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Finanças Casal
          </h1>
          <div className="h-0.5 w-16 bg-white/30 rounded-full mb-3"></div>
          <h2 className="text-xl font-medium text-white/90 animate-float">
            {activeTab}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default Header;
