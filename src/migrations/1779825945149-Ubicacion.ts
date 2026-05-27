import { MigrationInterface, QueryRunner } from "typeorm";

export class Ubicacion1779825945149 implements MigrationInterface {
    name = 'Ubicacion1779825945149'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_notification_owner"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_notification_business"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notification_owner_isRead"`);
        await queryRunner.query(`CREATE TABLE "departamento" ("id_departamento" SERIAL NOT NULL, "nombre" character varying NOT NULL, CONSTRAINT "UQ_574b538a96151008aa904a8d6f6" UNIQUE ("nombre"), CONSTRAINT "PK_be26d64344a1161ceb63ecbf2fc" PRIMARY KEY ("id_departamento"))`);
        await queryRunner.query(`CREATE TABLE "municipio" ("id_municipio" SERIAL NOT NULL, "nombre" character varying NOT NULL, "id_departamento" integer, CONSTRAINT "PK_bab504e86628565fdca3161e88f" PRIMARY KEY ("id_municipio"))`);
        await queryRunner.query(`ALTER TABLE "business" ADD "id_municipio" integer`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_274f7f52fe174d6f3f857ab420a" FOREIGN KEY ("ownerId") REFERENCES "user"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_3f8c58b424d4590d7249b11c4c8" FOREIGN KEY ("businessId") REFERENCES "business"("id_business") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "municipio" ADD CONSTRAINT "FK_50555fdb043e6ff1cb689e53566" FOREIGN KEY ("id_departamento") REFERENCES "departamento"("id_departamento") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business" ADD CONSTRAINT "FK_5b6aba51e687503c1bba5b5c12d" FOREIGN KEY ("id_municipio") REFERENCES "municipio"("id_municipio") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business" DROP CONSTRAINT "FK_5b6aba51e687503c1bba5b5c12d"`);
        await queryRunner.query(`ALTER TABLE "municipio" DROP CONSTRAINT "FK_50555fdb043e6ff1cb689e53566"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_3f8c58b424d4590d7249b11c4c8"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_274f7f52fe174d6f3f857ab420a"`);
        await queryRunner.query(`ALTER TABLE "business" DROP COLUMN "id_municipio"`);
        await queryRunner.query(`DROP TABLE "municipio"`);
        await queryRunner.query(`DROP TABLE "departamento"`);
        await queryRunner.query(`CREATE INDEX "IDX_notification_owner_isRead" ON "notification" ("isRead", "ownerId") `);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_notification_business" FOREIGN KEY ("businessId") REFERENCES "business"("id_business") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_notification_owner" FOREIGN KEY ("ownerId") REFERENCES "user"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
