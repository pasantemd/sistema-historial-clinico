"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";

import { EtiquetaCampo } from "@/componentes/ui/etiqueta-campo";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import {
  iniciarSesionSchema,
  type EntradaInicioSesion,
} from "@/modulos/autenticacion/validaciones/iniciar-sesion.schema";

const MENSAJE_CREDENCIALES_INVALIDAS =
  "El correo o la contraseña son incorrectos.";

export function FormularioInicioSesion({
  rutaRetorno,
}: {
  rutaRetorno: string;
}) {
  const router = useRouter();
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [procesando, iniciarTransicion] = useTransition();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EntradaInicioSesion>({
    resolver: zodResolver(iniciarSesionSchema),
    defaultValues: { correo: "", contrasena: "" },
  });

  const enviar = handleSubmit((datos) => {
    setErrorGeneral(undefined);
    iniciarTransicion(async () => {
      const resultado = await signIn("credentials", {
        correo: datos.correo,
        contrasena: datos.contrasena,
        callbackUrl: rutaRetorno,
        redirect: false,
      });

      if (!resultado?.ok) {
        setErrorGeneral(MENSAJE_CREDENCIALES_INVALIDAS);
        return;
      }

      router.push(rutaRetorno);
      router.refresh();
    });
  });

  return (
    <form className="space-y-5" onSubmit={enviar} noValidate>
      {errorGeneral && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {errorGeneral}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="correo"><EtiquetaCampo etiqueta="Correo electrónico" required /></Label>
        <Input
          id="correo"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className="h-11"
          aria-invalid={Boolean(errors.correo)}
          aria-describedby={errors.correo ? "correo-error" : undefined}
          {...register("correo")}
        />
        {errors.correo?.message && (
          <p id="correo-error" className="text-sm text-destructive">
            {errors.correo.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contrasena"><EtiquetaCampo etiqueta="Contraseña" required /></Label>
        <div className="relative">
          <Input
            id="contrasena"
            type={mostrarContrasena ? "text" : "password"}
            autoComplete="current-password"
            className="h-11 pr-12"
            aria-invalid={Boolean(errors.contrasena)}
            aria-describedby={errors.contrasena ? "contrasena-error" : undefined}
            {...register("contrasena")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 size-11"
            aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={mostrarContrasena}
            onClick={() => setMostrarContrasena((actual) => !actual)}
          >
            {mostrarContrasena ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </Button>
        </div>
        {errors.contrasena?.message && (
          <p id="contrasena-error" className="text-sm text-destructive">
            {errors.contrasena.message}
          </p>
        )}
      </div>

      <Button type="submit" className="h-11 w-full" disabled={procesando}>
        <LogIn aria-hidden />
        {procesando ? "Iniciando sesión…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
