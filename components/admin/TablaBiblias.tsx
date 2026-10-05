"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Globe2, Lock, Cloud, Users } from "lucide-react";
import {
  setVersionActiva,
  setVersionGlobal,
  asignarVersionAUsuario,
  quitarVersionDeUsuario,
} from "@/actions/admin";

interface VersionRow {
  id: number;
  codigo: string;
  nombre: string;
  activa: boolean;
  esGlobal: boolean;
  esApi: boolean;
  esPremium: boolean;
  versiculos: number;
  usuariosPermitidos: string[];
}

interface UsuarioRow {
  id: string;
  email: string | null;
  nombre: string | null;
  rol: string;
}

export function TablaBiblias({
  versiones,
  usuarios,
}: {
  versiones: VersionRow[];
  usuarios: UsuarioRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expandida, setExpandida] = useState<number | null>(null);

  function toggleActiva(v: VersionRow) {
    startTransition(async () => {
      await setVersionActiva(v.id, !v.activa);
      router.refresh();
    });
  }

  function toggleGlobal(v: VersionRow) {
    startTransition(async () => {
      await setVersionGlobal(v.id, !v.esGlobal);
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-4 py-3 text-left">Versión</th>
            <th className="px-4 py-3 text-left">Origen</th>
            <th className="px-4 py-3 text-right">Versículos</th>
            <th className="px-4 py-3 text-center">Visibilidad</th>
            <th className="px-4 py-3 text-center">Estado</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {versiones.map((v) => (
            <>
              <tr key={v.id} className="border-t border-stone-100">
                <td className="px-4 py-3">
                  <p className="font-medium text-stone-900">{v.nombre}</p>
                  <p className="text-xs text-stone-500">
                    {v.codigo}
                    {v.esPremium && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
                        premium
                      </span>
                    )}
                  </p>
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {v.esApi ? (
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Cloud className="size-3.5" /> api.bible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Check className="size-3.5" /> local
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-600">
                  {v.esApi ? "—" : v.versiculos.toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => toggleGlobal(v)}
                    disabled={pending}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
                      v.esGlobal
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                    title={v.esGlobal ? "Visible para todos" : "Solo usuarios asignados"}
                  >
                    {v.esGlobal ? (
                      <>
                        <Globe2 className="size-3.5" /> Global
                      </>
                    ) : (
                      <>
                        <Lock className="size-3.5" /> Privada
                      </>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => toggleActiva(v)}
                    disabled={pending}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
                      v.activa
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    {v.activa ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                    {v.activa ? "Activa" : "Apagada"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  {!v.esGlobal && (
                    <button
                      type="button"
                      onClick={() => setExpandida(expandida === v.id ? null : v.id)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-stone-600 hover:bg-stone-100"
                    >
                      <Users className="size-3.5" /> Usuarios ({v.usuariosPermitidos.length})
                    </button>
                  )}
                </td>
              </tr>
              {expandida === v.id && (
                <tr key={`${v.id}-exp`} className="bg-stone-50">
                  <td colSpan={6} className="px-4 py-4">
                    <PanelUsuarios versionId={v.id} usuarios={usuarios} permitidos={v.usuariosPermitidos} />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PanelUsuarios({
  versionId,
  usuarios,
  permitidos,
}: {
  versionId: number;
  usuarios: UsuarioRow[];
  permitidos: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const set = new Set(permitidos);

  function toggle(usuarioId: string, on: boolean) {
    startTransition(async () => {
      if (on) await asignarVersionAUsuario(versionId, usuarioId);
      else await quitarVersionDeUsuario(versionId, usuarioId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-stone-500">Marcá los usuarios que pueden ver esta versión.</p>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {usuarios.map((u) => {
          const on = set.has(u.id);
          return (
            <li key={u.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md bg-white px-3 py-2 text-xs hover:bg-stone-100">
                <input
                  type="checkbox"
                  checked={on}
                  disabled={pending}
                  onChange={(e) => toggle(u.id, e.target.checked)}
                  className="rounded border-stone-300"
                />
                <span className="truncate">
                  <span className="font-medium text-stone-800">{u.email}</span>
                  {u.nombre && <span className="ml-2 text-stone-500">{u.nombre}</span>}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
