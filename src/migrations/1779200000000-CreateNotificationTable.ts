import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationTable1779200000000 implements MigrationInterface {
  name = 'CreateNotificationTable1779200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notification" (
        "id"          SERIAL PRIMARY KEY,
        "ownerId"     integer NOT NULL,
        "businessId"  integer,
        "alertType"   varchar(50) NOT NULL,
        "isRead"      boolean NOT NULL DEFAULT false,
        "payload"     jsonb NOT NULL,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_notification_owner"
          FOREIGN KEY ("ownerId") REFERENCES "user"("id_usuario") ON DELETE CASCADE,
        CONSTRAINT "FK_notification_business"
          FOREIGN KEY ("businessId") REFERENCES "business"("id_business") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notification_owner_isRead"
        ON "notification" ("ownerId", "isRead")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notification_owner_isRead"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification"`);
  }
}
