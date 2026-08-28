import NamedPageForm from './NamedPageForm';
import {
  createCloudService,
  getCloudService,
  listCloudServices,
  updateCloudService,
} from '../lib/admin-api';

interface Props {
  entryId: string | null;
  canPublish: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

export default function CloudServiceForm(props: Props) {
  return (
    <NamedPageForm
      ns="admin.cloud_services"
      getEntry={getCloudService}
      createEntry={createCloudService}
      updateEntry={updateCloudService}
      listEntries={listCloudServices}
      {...props}
    />
  );
}
