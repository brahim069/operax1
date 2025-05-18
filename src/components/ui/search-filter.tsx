import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SearchFilterProps {
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;
  filters: {
    id: string;
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
  }[];
  className?: string;
}

export function SearchFilter({
  searchPlaceholder = "Rechercher...",
  onSearchChange,
  filters,
  className
}: SearchFilterProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="shrink-0">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtres
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Filtres</h4>
              <p className="text-sm text-muted-foreground">
                Affinez votre recherche avec les filtres
              </p>
            </div>
            <div className="grid gap-4">
              {filters.map((filter) => (
                <div key={filter.id} className="grid gap-2">
                  <Label htmlFor={filter.id}>{filter.label}</Label>
                  <Select value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger id={filter.id}>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 