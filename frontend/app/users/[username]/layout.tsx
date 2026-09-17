

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>


    <div style={{ flex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {children}
        </div>
    </div>
    </div>
  );
}