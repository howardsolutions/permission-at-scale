"use server"

import { tryFn } from "@/lib/helpers"
import {
  createProjectService,
  deleteProjectService,
  updateProjectService,
} from "@/services/project"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { ProjectFormValues } from "../schemas/projects"

export async function createProjectAction(data: ProjectFormValues) {


  const [error, project] = await tryFn(() =>
    createProjectService(data),
  )

  if (error) return error

  revalidatePath(`/projects/${project.id}`)
  return redirect(`/projects/${project.id}`)
}

export async function updateProjectAction(
  projectId: string,
  data: ProjectFormValues,
) {
  const [error] = await tryFn(() =>
    updateProjectService(projectId, data),
  )
  if (error) return error

  revalidatePath(`/projects/${projectId}`)
  return redirect(`/projects/${projectId}`)
}

export async function deleteProjectAction(projectId: string) {
  const [error] = await tryFn(() => deleteProjectService(projectId))
  if (error) return error

  revalidatePath(`/projects/${projectId}`)
  redirect("/projects")
}
