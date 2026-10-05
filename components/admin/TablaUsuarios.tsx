"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldOff, BookMarked, Crown } from "lucide-react";
import {
  setUsuarioRol,
  asignarVersionAUsuario,
  quitarVersionDeUsuario,
} from "@/actions/admin";

interface VersionRef {
  id: number;
  codigo: string;
  nombre: string;
  esGlobal?: boolean;
}

interface UsuarioRow {
  id: string;
  email: string;
  nombre: string | null;
  rol: string;
  premium: boolean;
  creadoEn: string;
  versionesPermitidas: VersionRef[];
}

export function TablaUsuarios({
  usuarios,
  versionesPrivadas,
}: {
  usuarios: UsuarioRow[];
  versionesPrivadas: VersionRef[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expandida, setExpandida] = useState<string | null>(null);

  function toggleAdmin(u: UsuarioRow) {
    if (
      !confirm(
        `${u.rol === "admin" ? "Quitar" : "Dar"} rol admin a ${u.email}?`,
      )
    )
      return;
    startTransition(async () => {
      await setUsuarioRol(u.id, u.rol === "admin" ? "usuario" : "admin");
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-4 py-3 text-left">Usuario</th>
            <th className="px-4 py-3 text-center">Plan</th>
            <th className="px-4 py-3 text-center">Rol</th>
            <th className="px-4 py-3 text-center">Versiones privadas</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <>
              <tr key={u.id} className="border-t border-stone-100">
                <td className="px-4 py-3">
                  <p className="font-medium text-stone-900">{u.email}</p>
                  <p className="text-xs text-stone-500">
                    {u.nombre ?? "Sin nombre"} ·{" "}
                    {new Date(u.creadoEn).toLocaleDateString("es-AR")}
                  </p>
                </td>
                <td className="px-4 py-3 text-center">
                  {u.premium ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                      <Crown className="size-3" /> Premium
                    </span>
                  ) : (
                    <span className="text-xs text-stone-400">Free</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => toggleAdmin(u)}
                    disabled={pending}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
                      u.rol === "admin"
                        ? "bg-violet-50 text-violet-700 hover:bg-violet-100"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {u.rol === "admin" ? (
                      <>
                        <ShieldCheck className="size-3.5" /> Admin
                      </>
                    ) : (
                      <>
                        <ShieldOff className="size-3.5" /> Usuario
                      </>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-center text-xs text-stone-600">
                  {u.versionesPermitidas.length > 0
                    ? u.versionesPermitidas.map((v) => v.codigo).join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setExpandida(expandida === u.id ? null : u.id)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-stone-600 hover:bg-stone-100"
                    disabled={versionesPrivadas.length === 0}
                  >
                    <BookMarked className="size-3.5" /> Permisos
                  </button>
                </td>
              </tr>
              {expandida === u.id && (
                <tr key={`${u.id}-exp`} className="bg-stone-50">
                  <td colSpan={5} className="px-4 py-4">
                    <PanelVersiones
                      usuarioId={u.id}
                      versiones={versionesPrivadas}
                      permitidos={u.versionesPermitidas.map((v) => v.id)}
                    />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
      {usuarios.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-stone-500">No hay usuarios todavía.</p>
      )}
    </div>
  );
}

function PanelVersiones({
  usuarioId,
  versiones,
  permitidos,
}: {
  usuarioId: string;
  versiones: VersionRef[];
  permitidos: number[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const set = new Set(permitidos);

  function toggle(versionId: number, on: boolean) {
    startTransition(async () => {
      if (on) await asignarVersionAUsuario(versionId, usuarioId);
      else await quitarVersionDeUsuario(versionId, usuarioId);
      router.refresh();
    });
  }

  if (versiones.length === 0)
    return <p className="text-xs text-stone-500">No hay versiones privadas todavía.</p>;

  return (
    <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
      {versiones.map((v) => {
        const on = set.has(v.id);
        return (
          <li key={v.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded-md bg-white px-3 py-2 text-xs hover:bg-stone-100">
              <input
                type="checkbox"
                checked={on}
                disabled={pending}
                onChange={(e) => toggle(v.id, e.target.checked)}
                className="rounded border-stone-300"
              />
              <span className="font-medium text-stone-800">{v.nombre}</span>
              <span className="ml-1 text-stone-500">({v.codigo})</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
