import { motion } from "framer-motion";
import { listItem } from "@/lib/animations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";

interface AnimatedTableProps {
  headers: string[];
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
  emptyState?: {
    title: string;
    description: string;
    action?: React.ReactNode;
  };
  isLoading?: boolean;
}

export function AnimatedTable({ 
  headers, 
  data, 
  renderRow, 
  emptyState,
  isLoading = false 
}: AnimatedTableProps) {
  if (isLoading) {
    return <TableSkeleton columnCount={headers.length} />;
  }

  if (data.length === 0 && emptyState) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header, index) => (
            <TableHead key={index}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <motion.tr
            key={index}
            initial="hidden"
            animate="visible"
            variants={listItem}
            custom={index}
          >
            {renderRow(item, index)}
          </motion.tr>
        ))}
      </TableBody>
    </Table>
  );
} 