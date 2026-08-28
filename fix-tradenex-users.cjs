const fs = require('fs');
const path = require('path');

const file = path.join(process.env.HOME || '.', 'tradenex-backend', 'server.cjs');
if (!fs.existsSync(file)) {
  console.error('server.cjs नहीं मिला:', file);
  process.exit(1);
}

const s = fs.readFileSync(file, 'utf8');
const old = `        if (fileName === USERS_FILE) {\n          await pool.query(\n            "BEGIN"\n          );\n\n          try {\n            await pool.query(\n              "DELETE FROM users"\n            );\n\n            for (const user of data) {\n              await pool.query(\n                \`\n                INSERT INTO users\n                  (id, data, created_at)\n                VALUES\n                  ($1, $2::jsonb, COALESCE($3::timestamptz, NOW()))\n                ON CONFLICT (id)\n                DO UPDATE SET\n                  data = EXCLUDED.data\n                \`,\n                [\n                  String(user.id),\n                  JSON.stringify(user),\n                  user.createdAt || null,\n                ]\n              );\n            }\n\n            await pool.query(\n              "COMMIT"\n            );\n          } catch (error) {\n            await pool.query(\n              "ROLLBACK"\n            );\n            throw error;\n          }\n\n          return;\n        }`;

const replacement = `        if (fileName === USERS_FILE) {\n          /* Never delete the whole users table during a normal write.\n             Persist each user independently so stale/concurrent user arrays\n             cannot erase users created by another request/instance. */\n          await pool.query("BEGIN");\n\n          try {\n            for (const user of data) {\n              if (!user || user.id == null) continue;\n\n              await pool.query(\n                \`\n                INSERT INTO users\n                  (id, data, created_at)\n                VALUES\n                  ($1, $2::jsonb, COALESCE($3::timestamptz, NOW()))\n                ON CONFLICT (id)\n                DO UPDATE SET\n                  data = EXCLUDED.data\n                \`,\n                [\n                  String(user.id),\n                  JSON.stringify(user),\n                  user.createdAt || null,\n                ]\n              );\n            }\n\n            await pool.query("COMMIT");\n          } catch (error) {\n            await pool.query("ROLLBACK");\n            throw error;\n          }\n\n          return;\n        }`;

if (!s.includes(old)) {
  if (s.includes('Never delete the whole users table during a normal write.')) {
    console.log('Fix पहले से लागू है। कुछ बदलने की जरूरत नहीं।');
    process.exit(0);
  }
  console.error('Expected users persistence block नहीं मिला। File को manually बदलना सुरक्षित नहीं है।');
  process.exit(2);
}

const backup = file + '.before-user-fix-' + Date.now();
fs.copyFileSync(file, backup);
fs.writeFileSync(file, s.replace(old, replacement));
console.log('FIX APPLIED');
console.log('Backup:', backup);
console.log('अब चलाओ: node --check server.cjs');
