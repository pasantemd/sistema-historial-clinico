import{NavegacionConfiguracion}from"@/componentes/navegacion/navegacion-configuracion";import{requerirUsuario}from"@/servicios/autenticacion/requerir-usuario";
export default async function LayoutConfiguracion({children}:{children:React.ReactNode}){const usuario=await requerirUsuario();return <div className="space-y-6"><NavegacionConfiguracion usuario={usuario}/>{children}</div>}
