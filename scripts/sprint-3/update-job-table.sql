alter table jobs
drop column payment_status;
alter table jobs
drop column expired_type;

alter table jobs
add expired_days int(11) null;

alter table jobs
add is_deleted bool not null default 0;

alter table jobs
add total_applicants int(11) not null default 0;

alter table users
add is_deleted bool not null default 0;

alter table jobs
add total_view bigint(20) not null default 0;

alter table job_applicants
add column total_point float;

alter table job_applicants
add column assessments_result text;



