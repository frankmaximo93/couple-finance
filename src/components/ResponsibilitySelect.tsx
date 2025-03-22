
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ResponsibilitySelectProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function ResponsibilitySelect({ value, onChange, className }: ResponsibilitySelectProps) {
  return (
    <div className={className}>
      <Label htmlFor="responsibility">Responsabilidade</Label>
      <Select 
        value={value} 
        onValueChange={onChange}
      >
        <SelectTrigger id="responsibility">
          <SelectValue placeholder="Selecione a responsabilidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="franklin">Franklim</SelectItem>
          <SelectItem value="michele">Michele</SelectItem>
          <SelectItem value="casal">Casal (divide 50/50)</SelectItem>
        </SelectContent>
      </Select>
      {value === 'casal' && (
        <p className="text-xs text-muted-foreground mt-1">
          Será dividido automaticamente 50% para cada carteira
        </p>
      )}
    </div>
  );
}
