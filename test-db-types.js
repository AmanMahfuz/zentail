const fs = require('fs');
const content = fs.readFileSync('src/types/database.types.ts', 'utf8');

const userProjectsDef = `
      user_projects: {
        Row: {
          created_at: string
          description: string | null
          github_url: string | null
          id: string
          live_url: string | null
          skills_demonstrated: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          github_url?: string | null
          id?: string
          live_url?: string | null
          skills_demonstrated?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          github_url?: string | null
          id?: string
          live_url?: string | null
          skills_demonstrated?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }`;

const userSkillsDef = `
      user_skills: {
        Row: {
          created_at: string
          id: string
          proof_description: string | null
          proof_links: string[] | null
          proof_status: string | null
          skill_name: string
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          proof_description?: string | null
          proof_links?: string[] | null
          proof_status?: string | null
          skill_name: string
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          proof_description?: string | null
          proof_links?: string[] | null
          proof_status?: string | null
          skill_name?: string
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }`;

// Add them to the tables
let newContent = content.replace('    Tables: {', '    Tables: {' + userProjectsDef + userSkillsDef);

// Update applications
const applicationsRow = `          feedback: string | null
          rejection_reason: string | null
          stage_reached: string | null`;

const applicationsInsert = `          feedback?: string | null
          rejection_reason?: string | null
          stage_reached?: string | null`;

newContent = newContent.replace('          updated_at: string\n          user_id: string\n        }\n        Insert: {', applicationsRow + '\n          updated_at: string\n          user_id: string\n        }\n        Insert: {');
newContent = newContent.replace('          updated_at?: string\n          user_id: string\n        }\n        Update: {', applicationsInsert + '\n          updated_at?: string\n          user_id: string\n        }\n        Update: {');
newContent = newContent.replace('          updated_at?: string\n          user_id?: string\n        }\n        Relationships: [', applicationsInsert + '\n          updated_at?: string\n          user_id?: string\n        }\n        Relationships: [');

fs.writeFileSync('src/types/database.types.ts', newContent);
console.log('done');
