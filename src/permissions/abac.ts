import { getAllProjects } from "@/dal/projects/queries";
import { Document, Project, ProjectTable, User } from "@/drizzle/schema"
import { getCurrentUser } from "@/lib/session";
import { eq, isNull, or } from "drizzle-orm";
import { cache } from "react";

export const getUserPermission = cache(getUserPermissionInternal)

async function getUserPermissionInternal() {
    const user = await getCurrentUser()

    const builder = new PermissionBuilder()

    if (user == null) {
        // can() always return false, because user has no permissions
        return builder.build()
    }

    const role = user.role;

    switch (role) {
        case "admin":
            addAdminPermission(builder)
            break;

        case "editor":
            addEditorPermission(builder, user)
            break;

        case "viewer":
        case "author":
            break;

        default:
            throw new Error(`Unhandled role: ${role satisfies never}`)
    }
}

function addAdminPermission(builder: PermissionBuilder) {
    builder
        .allow("document", "read")
        .allow("document", "update")
        .allow("document", "delete")
        .allow("document", "create")

        .allow("project", "read")
        .allow("project", "update")
        .allow("project", "delete")
        .allow("project", "create")
}

async function addEditorPermission(builder: PermissionBuilder, user: Pick<User, "department">) {
    builder
        .allow("project", "read", { department: user.department })
        .allow("project", "update", { department: null })

    const projects = await getDepartmentProjects(user.department);

    projects.forEach(project => {
        builder.allow("document", "read", { projectId: project.id })
            .allow("document", "update", { projectId: project.id, isLocked: false })
    })
}

async function getDepartmentProjects(department: string) {
    return await getAllProjects({
        ordered: false,
        where: or(
            eq(ProjectTable.department, department),
            isNull(ProjectTable.department)
        ),
    });
}

type Resources = {
    project: {
        action: "create" | "read" | "update" | "delete",
        condition: Pick<Project, "department">
    },
    document: {
        action: "create" | "read" | "update" | "delete",
        condition: Pick<Document, "projectId" | "creatorId" | "status" | "isLocked">
    }
}

type Permission<Res extends keyof Resources> = {
    action: Resources[Res]["action"],
    condition?: Partial<Resources[Res]["condition"]>,
}

type PermissionStore = {
    [Res in keyof Resources]: Permission<Res>[]
}

class PermissionBuilder {
    #permissions: PermissionStore = {
        document: [],
        project: []
    }

    allow<Res extends keyof Resources>(
        resourse: Res,
        action: Permission<Res>["action"],
        condition?: Permission<Res>["condition"]) {
        this.#permissions[resourse].push({ action, condition })

        return this
    }

    build() {
        const permissions = this.#permissions;

        return {
            can<Res extends keyof Resources>(resource: Res, action: Resources[Res]["action"], data?: Resources[Res]["condition"]) {
                return permissions[resource].some(permission => {
                    if (permission.action !== action) return false

                    // do we have valid data argument
                    const validData = permission.condition == null ||
                        data == null ||
                        Object.entries(permission.condition).every(([key, value]) => {
                            return data[key as keyof typeof permission.condition] === value
                        })

                    return validData
                })
            }
        }
    }
}