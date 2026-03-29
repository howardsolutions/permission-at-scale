import { db } from "@/drizzle/db"
import { ProjectTable } from "@/drizzle/schema"
import type { SQL } from "drizzle-orm"
import { eq } from "drizzle-orm"

export async function getAllProjects(
  { ordered = false, where }: { ordered?: boolean; where?: SQL } = {},
) {
  return db.query.ProjectTable.findMany({
    where,
    orderBy: ordered ? ProjectTable.name : undefined,
  })
}

export async function getProjectById(id: string) {
  return db.query.ProjectTable.findFirst({
    where: eq(ProjectTable.id, id),
  })
}
