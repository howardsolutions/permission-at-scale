import { createDocument, deleteDocument, updateDocument } from "@/dal/documents/mutations"
import { AuthorizationError } from "@/lib/errors"
import { getCurrentUser } from "@/lib/session"
import { DocumentFormValues, documentSchema } from "@/schemas/documents"

export async function createDocumentService(
  projectId: string,
  data: DocumentFormValues,
): Promise<{ id: string }> {
  // Check User Permission
  const user = await getCurrentUser()

  if (user == null) throw new AuthorizationError("Not authenticated")

  if (user.role !== "author" && user.role !== "admin") {
    throw new AuthorizationError()
  }

  // Validate the data, error validation
  const result = documentSchema.safeParse(data)

  if (!result.success) throw new Error("Invalid data")

  // database mutation
  const created = await createDocument({
    ...result.data,
    projectId,
    creatorId: user.id,
    lastEditedById: user.id,
  })

  if (!created) throw new Error("Failed to create document")

  return created
}

export async function updateDocumentActionService(
  documentId: string,
  data: DocumentFormValues,
) {
  const user = await getCurrentUser()
  if (user == null) throw new Error("Not authenticated");

  // Permission
  if (user.role === "viewer") throw new AuthorizationError()

  const result = documentSchema.safeParse(data)

  if (!result.success) throw new Error("Invalid data")

  return updateDocument(documentId, {
    ...result.data,
    lastEditedById: user.id,
  })
}


export async function deleteDocumentService(
  documentId: string,
) {

  const user = await getCurrentUser()

  if (user == null) return { message: "Not authenticated" }


  return deleteDocument(documentId);
}
