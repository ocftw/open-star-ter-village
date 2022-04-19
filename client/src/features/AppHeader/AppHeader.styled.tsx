export const Header: React.FC = ({ children, ...rest }) =>
  <header className="h-16 flex flex-row items-center justify-center bg-slate-900 text-white text-2xl" {...rest}>
    {children}
  </header>;

export const Link: React.FC<JSX.IntrinsicElements["a"]> = ({ children, ...rest }) =>
  <a className="px-2 text-cyan-300" {...rest}>
    {children}
  </a>;
