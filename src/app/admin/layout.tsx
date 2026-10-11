import "@fontsource-variable/plus-jakarta-sans/wght.css";
import "@fontsource/hind-siliguri/bengali-400.css";
import "@fontsource/hind-siliguri/bengali-500.css";
import "@fontsource/hind-siliguri/bengali-600.css";
import "@fontsource/hind-siliguri/bengali-700.css";
import "./admin.css";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-ui">{children}</div>;
}
