// Portfolio page — public, ISR, renders user portfolio
// Full implementation in Task 19

interface PortfolioPageProps {
  params: Promise<{ username: string }>;
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { username } = await params;

  return (
    <div>
      <h1>Portfolio: {username}</h1>
      <p>Published portfolio will render here.</p>
    </div>
  );
}

// ISR: revalidate every hour
export const revalidate = 3600;
