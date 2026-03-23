type Props = {
  greeting: string;
  name: string;
};

export function DashboardHeader({ greeting, name }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-4xl md:text-5xl font-black tracking-tight">
        <span suppressHydrationWarning>{greeting}</span>،
        <span className="text-primary">{name}</span>
      </h1>
      <p className="text-muted-foreground font-medium text-lg">نظرة سريعة على أدائك اليوم. استمر في التحسن!</p>
    </div>
  );
}
