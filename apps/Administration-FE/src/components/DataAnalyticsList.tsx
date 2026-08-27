import NamedPageList from './NamedPageList';
import { deleteDataAnalytic, listDataAnalytics } from '../lib/admin-api';

interface Props {
  onAdd: () => void;
  onEdit: (id: string) => void;
  notice: string | null;
}

export default function DataAnalyticsList(props: Props) {
  return (
    <NamedPageList
      ns="admin.data_analytics"
      columnMode="data"
      list={listDataAnalytics}
      remove={deleteDataAnalytic}
      {...props}
    />
  );
}
