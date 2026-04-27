import React from 'react';

const Foot: React.FC = () => {
  const footerLinks = [
    'Terms', 'Privacy', 'Security', 'Status', 'Docs', 
    'Contact', 'Manage cookies', 'Do not share my personal information'
  ];

  return (
    <footer className="flex items-center justify-center space-x-4 py-10 text-xs text-gray-500 border-t border-gray-200">
      <div className="flex items-center space-x-2">
        <img src="/images/earn.png" alt="Earn" className="w-8" />
        <span>© 2026 GitHub, Inc.</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex items-center space-x-4">
        {footerLinks.map((link) => (
          <a
            key={link}
            href=''
          >
            {link}
          </a>
        ))}
      </nav>
    </footer>
  );
};

export default Foot;
