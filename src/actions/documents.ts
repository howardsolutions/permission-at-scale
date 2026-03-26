"use server"

import {
  deleteDocument,
  updateDocument
} from "@/dal/documents/mutations"
import { tryFn } from "@/lib/helpers"
import { getCurrentUser } from "@/lib/session"
import { createDocumentService, deleteDocumentService, updateDocumentActionService } from "@/services/document"
import { redirect } from "next/navigation"
import { documentSchema, type DocumentFormValues } from "../schemas/documents"

export async function createDocumentAction(
  projectId: string,
  data: DocumentFormValues,
) {
  const [error, document] = await tryFn(() => createDocumentService(projectId, data))

  if (error) return error

  redirect(`/projects/${projectId}/documents/${document.id}`)
}

export async function updateDocumentAction(
  documentId: string,
  projectId: string,
  data: DocumentFormValues,
) {
  const [error, updatedDocment] = await tryFn(() =>
    updateDocumentActionService(documentId, data)
  )

  if (error) return error

  redirect(`/projects/${projectId}/documents/${documentId}`)
}

export async function deleteDocumentAction(
  documentId: string,
  projectId: string,
) {
  const [error] = await tryFn(() => deleteDocumentService(documentId))

  if (error) return error

  redirect(`/projects/${projectId}`)
}
