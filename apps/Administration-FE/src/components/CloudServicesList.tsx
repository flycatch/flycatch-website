import NamedPageList from './NamedPageList';
import {
  deleteCloudService,
  listCloudServices,
} from '../lib/admin-api';

interface Props {
  onAdd: () => void;
  onEdit: (id: string) => void;
  notice: string | null;
}

export default function CloudServicesList(props: Props) {
  return (
    <NamedPageList
      ns="admin.cloud_services"
      columnMode="cloud"
      list={listCloudServices}
      remove={deleteCloudService}
      bulkPath="/admin/cloud-services"
      {...props}
    />
  );
}
