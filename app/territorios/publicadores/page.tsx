import { AppLayout } from '@/components/common/AppLayout'
import { PublishersView } from "@/components/vymc/publishers/publishers-view";

/**
 * Publicadores del panel Territorios: misma vista que VYMC,
 * respondiendo al tema claro/oscuro global del sitio.
 */
export default function TerritoriesPublishersPage() {
  return (
    <AppLayout title="Publicadores">
      <div className="p-6">
        <PublishersView />
      </div>
    </AppLayout>
  );
}
