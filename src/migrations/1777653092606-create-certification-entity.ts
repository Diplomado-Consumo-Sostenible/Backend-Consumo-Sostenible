import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCertificationEntity1777653092606 implements MigrationInterface {
    name = 'CreateCertificationEntity1777653092606'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."certifications_status_enum" AS ENUM('Active', 'Pending', 'Rejected')`);
        await queryRunner.query(`CREATE TABLE "certifications" ("id_certification" SERIAL NOT NULL, "name" character varying NOT NULL, "issuing_entity" character varying NOT NULL, "verification_url" character varying NOT NULL, "badge_url" character varying NOT NULL, "status" "public"."certifications_status_enum" NOT NULL DEFAULT 'Pending', "id_business" integer, CONSTRAINT "PK_d6411fb1106ead370a8c19813b2" PRIMARY KEY ("id_certification"))`);
        await queryRunner.query(`ALTER TABLE "certifications" ADD CONSTRAINT "FK_5f947b6b81e1873742fe2975b81" FOREIGN KEY ("id_business") REFERENCES "business"("id_business") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "certifications" DROP CONSTRAINT "FK_5f947b6b81e1873742fe2975b81"`);
        await queryRunner.query(`DROP TABLE "certifications"`);
        await queryRunner.query(`DROP TYPE "public"."certifications_status_enum"`);
    }

}
