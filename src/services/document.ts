import {
  createDocument,
  deleteDocument,
  updateDocument,
} from "@/dal/documents/mutations"
import {
  getDocumentById,
  getDocumentWithUserInfo,
  getProjectDocuments,
} from "@/dal/documents/queries"
import { AuthorizationError } from "@/lib/errors"
import { getCurrentUser } from "@/lib/session"
import { can } from "@/permissions/rbac"
import { DocumentFormValues, documentSchema } from "@/schemas/documents"

export async function createDocumentService(
  projectId: string,
  data: DocumentFormValues,
) {
  const user = await getCurrentUser()

  if (!can(user, "document:create")) throw new Error("Unauthenticated")

  const result = documentSchema.safeParse(data)
  if (!result.success) throw new Error("Invalid data")

  return createDocument({
    ...result.data,
    projectId,
    creatorId: user!.id,
    lastEditedById: user!.id,
  })
}

export async function updateDocumentService(
  documentId: string,
  data: DocumentFormValues,
) {
  const user = await getCurrentUser()

  if (!can(user, "document:update")) throw new Error("Unauthenticated")

  const result = documentSchema.safeParse(data)
  if (!result.success) throw new Error("Invalid data")

  return updateDocument(documentId, {
    ...result.data,
    lastEditedById: user!.id,
  })
}

export async function deleteDocumentService(documentId: string) {
  const user = await getCurrentUser()

  if (!can(user, "document:delete")) {
    throw new AuthorizationError()
  }

  return deleteDocument(documentId)
}

export async function getDocumentByIdService(id: string) {
  // PERMISSION:
  const user = await getCurrentUser()

  if (!can(user, "document:read")) throw new Error("Unauthenticated")

  return getDocumentById(id)
}

export async function getProjectDocumentsService(projectId: string) {
  // PERMISSION:
  const user = await getCurrentUser()

  if (!can(user, "document:read")) throw new Error("Unauthenticated")

  return getProjectDocuments(projectId)
}

export async function getDocumentWithUserInfoService(id: string) {
  // PERMISSION:
  const user = await getCurrentUser()
  
  if (!can(user, "document:read")) throw new Error("Unauthenticated")

  return getDocumentWithUserInfo(id)
}