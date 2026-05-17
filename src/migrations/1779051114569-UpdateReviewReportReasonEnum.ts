import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateReviewReportReasonEnum1779051114569 implements MigrationInterface {
    name = 'UpdateReviewReportReasonEnum1779051114569'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."review_reports_reason_enum" RENAME TO "review_reports_reason_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."review_reports_reason_enum" AS ENUM('Lenguaje inapropiado u ofensivo', 'Contenido falso o engañoso', 'Spam o publicidad no solicitada', 'Acoso o amenazas', 'Información personal expuesta', 'Otro motivo')`);
        await queryRunner.query(`ALTER TABLE "review_reports" ALTER COLUMN "reason" TYPE "public"."review_reports_reason_enum" USING "reason"::"text"::"public"."review_reports_reason_enum"`);
        await queryRunner.query(`DROP TYPE "public"."review_reports_reason_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."review_reports_reason_enum_old" AS ENUM('Lenguaje ofensivo o inapropiado', 'Spam o publicidad', 'Reseña falsa o no es cliente', 'Otro')`);
        await queryRunner.query(`ALTER TABLE "review_reports" ALTER COLUMN "reason" TYPE "public"."review_reports_reason_enum_old" USING "reason"::"text"::"public"."review_reports_reason_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."review_reports_reason_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."review_reports_reason_enum_old" RENAME TO "review_reports_reason_enum"`);
    }

}
