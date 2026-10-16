
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { pageMap } from "../../routes/pageMap";

type Props = {
    params: Promise<{
        pagina: string;
    }>;
};

export default function DynamicPage({ params }: Props) {
    return (
        <Suspense fallback={<main>Carregando página...</main>}>
            <ResolvedPage params={params} />
        </Suspense>
    );
}

async function ResolvedPage({ params }: Props) {
    const { pagina } = await params;

    const Page = pageMap[pagina as keyof typeof pageMap];

    if (!Page) {
        notFound();
    }

    return <Page />;
}
