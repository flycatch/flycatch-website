import { DATA_PAGE_NAMES } from '../lib/service-page-names';
import NamedPageForm from './NamedPageForm';
import {
  createDataAnalytic,
  getDataAnalytic,
  listDataAnalytics,
  updateDataAnalytic,
} from '../lib/admin-api';

interface Props {
  entryId: string | null;
  canPublish: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

export default function DataAnalyticsForm(props: Props) {
  return (
    <NamedPageForm
      ns="admin.data_analytics"
      pageNames={DATA_PAGE_NAMES}
      getEntry={getDataAnalytic}
      createEntry={createDataAnalytic}
      updateEntry={updateDataAnalytic}
      listEntries={listDataAnalytics}
      {...props}
    />
  );
}
