import { getAllProjects } from "@/dal/projects/queries";
import { Document, Project, ProjectTable, User } from "@/drizzle/schema"
import { eq, isNull, or } from "drizzle-orm";

function getUserPermission(user: Pick<User, "department" | "role">) {
    const builder = new PermissionBuilder()

    const role = user.role;

    switch (role) {
        case "admin":
            addAdminPermission(builder)
        case "editor":
            addEditorPermission(builder, user)
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

    allow<Res extends keyof Resources>(resourse: Res,
        action: Permission<Res>["action"],
        condition?: Permission<Res>["condition"]) {
        this.#permissions[resourse].push({ action, condition })

        return this
    }
}