import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReviewModerationSystem1778890393596 implements MigrationInterface {
    name = 'AddReviewModerationSystem1778890393596'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business" DROP CONSTRAINT "FK_aba0b45f2c0dd908034b69733ba"`);
        await queryRunner.query(`ALTER TABLE "business" DROP CONSTRAINT "FK_487d281ccd7455cfddeff6cf2ff"`);
        await queryRunner.query(`CREATE TYPE "public"."review_reports_reason_enum" AS ENUM('Lenguaje ofensivo o inapropiado', 'Spam o publicidad', 'Reseña falsa o no es cliente', 'Otro')`);
        await queryRunner.query(`CREATE TYPE "public"."review_reports_status_enum" AS ENUM('Pendiente', 'Resuelto', 'Descartado')`);
        await queryRunner.query(`CREATE TABLE "review_reports" ("id_report" SERIAL NOT NULL, "reason" "public"."review_reports_reason_enum" NOT NULL, "details" text, "status" "public"."review_reports_status_enum" NOT NULL DEFAULT 'Pendiente', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_usuario" integer, "id_review" integer, CONSTRAINT "UQ_2a3771e9f0405b8c938f71e2920" UNIQUE ("id_usuario", "id_review"), CONSTRAINT "PK_778a607e5b096271446f07a720c" PRIMARY KEY ("id_report"))`);
        await queryRunner.query(`CREATE TABLE "review_blocks" ("id_block" SERIAL NOT NULL, "blocked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_usuario" integer, "id_business" integer, CONSTRAINT "UQ_1a6949248137721ff9ce2cfe4c4" UNIQUE ("id_usuario", "id_business"), CONSTRAINT "PK_44e61286d9b60446108eb639488" PRIMARY KEY ("id_block"))`);
        await queryRunner.query(`ALTER TABLE "business" RENAME COLUMN "userIdUsuario" TO "id_usuario"`);
        await queryRunner.query(`ALTER TABLE "business" RENAME COLUMN "categoryIdCategory" TO "id_category"`);
        await queryRunner.query(`ALTER TABLE "review" ADD "report_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "review" ADD "is_hidden_by_moderation" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "review_reports" ADD CONSTRAINT "FK_fe1e88f139e1e4b53e39c0aeeea" FOREIGN KEY ("id_usuario") REFERENCES "user"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review_reports" ADD CONSTRAINT "FK_62acffa6a01cb718018fd7eeaec" FOREIGN KEY ("id_review") REFERENCES "review"("id_review") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review_blocks" ADD CONSTRAINT "FK_3d393533f28f9f9d9d3275d8b04" FOREIGN KEY ("id_usuario") REFERENCES "user"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review_blocks" ADD CONSTRAINT "FK_6ef937c383d08b97ec88a9509ae" FOREIGN KEY ("id_business") REFERENCES "business"("id_business") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business" ADD CONSTRAINT "FK_f6cc9f9f574252953de7490d78a" FOREIGN KEY ("id_usuario") REFERENCES "user"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business" ADD CONSTRAINT "FK_cf9b34052b1dfcbc5bd432467ab" FOREIGN KEY ("id_category") REFERENCES "category"("id_category") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business" DROP CONSTRAINT "FK_cf9b34052b1dfcbc5bd432467ab"`);
        await queryRunner.query(`ALTER TABLE "business" DROP CONSTRAINT "FK_f6cc9f9f574252953de7490d78a"`);
        await queryRunner.query(`ALTER TABLE "review_blocks" DROP CONSTRAINT "FK_6ef937c383d08b97ec88a9509ae"`);
        await queryRunner.query(`ALTER TABLE "review_blocks" DROP CONSTRAINT "FK_3d393533f28f9f9d9d3275d8b04"`);
        await queryRunner.query(`ALTER TABLE "review_reports" DROP CONSTRAINT "FK_62acffa6a01cb718018fd7eeaec"`);
        await queryRunner.query(`ALTER TABLE "review_reports" DROP CONSTRAINT "FK_fe1e88f139e1e4b53e39c0aeeea"`);
        await queryRunner.query(`ALTER TABLE "business" RENAME COLUMN "id_usuario" TO "userIdUsuario"`);
        await queryRunner.query(`ALTER TABLE "business" RENAME COLUMN "id_category" TO "categoryIdCategory"`);
        await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "is_hidden_by_moderation"`);
        await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "report_count"`);
        await queryRunner.query(`DROP TABLE "review_blocks"`);
        await queryRunner.query(`DROP TABLE "review_reports"`);
        await queryRunner.query(`DROP TYPE "public"."review_reports_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."review_reports_reason_enum"`);
        await queryRunner.query(`ALTER TABLE "business" ADD CONSTRAINT "FK_487d281ccd7455cfddeff6cf2ff" FOREIGN KEY ("categoryIdCategory") REFERENCES "category"("id_category") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business" ADD CONSTRAINT "FK_aba0b45f2c0dd908034b69733ba" FOREIGN KEY ("userIdUsuario") REFERENCES "user"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
