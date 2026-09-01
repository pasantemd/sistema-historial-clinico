export function CampoError({ mensaje, id }: { mensaje?: string; id?: string }) {
  return mensaje ? <p id={id} role="alert" className="text-sm font-medium text-destructive">{mensaje}</p> : null;
}
