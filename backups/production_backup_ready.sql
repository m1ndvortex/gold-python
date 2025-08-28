--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

-- Started on 2025-08-28 20:19:43 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS goldshop;
--
-- TOC entry 4062 (class 1262 OID 16384)
-- Name: goldshop; Type: DATABASE; Schema: -; Owner: goldshop_user
--

CREATE DATABASE goldshop WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE goldshop OWNER TO goldshop_user;

\connect goldshop

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 18736)
-- Name: analytics; Type: SCHEMA; Schema: -; Owner: goldshop_user
--

CREATE SCHEMA analytics;


ALTER SCHEMA analytics OWNER TO goldshop_user;

--
-- TOC entry 7 (class 2615 OID 20061)
-- Name: public; Type: SCHEMA; Schema: -; Owner: goldshop_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO goldshop_user;

--
-- TOC entry 4063 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: goldshop_user
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 2 (class 3079 OID 20062)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 4065 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 269 (class 1255 OID 18934)
-- Name: cleanup_expired_cache(); Type: FUNCTION; Schema: analytics; Owner: goldshop_user
--

CREATE FUNCTION analytics.cleanup_expired_cache() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM analytics.analytics_cache WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$;


ALTER FUNCTION analytics.cleanup_expired_cache() OWNER TO goldshop_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 18872)
-- Name: alert_history; Type: TABLE; Schema: analytics; Owner: goldshop_user
--

CREATE TABLE analytics.alert_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rule_id uuid NOT NULL,
    alert_level text NOT NULL,
    message text NOT NULL,
    triggered_value numeric(15,4),
    threshold_value numeric(15,4),
    entity_type text,
    entity_id uuid,
    notification_sent boolean DEFAULT false,
    acknowledged boolean DEFAULT false,
    acknowledged_by uuid,
    acknowledged_at timestamp with time zone,
    resolved boolean DEFAULT false,
    resolved_at timestamp with time zone,
    additional_data jsonb,
    triggered_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE analytics.alert_history OWNER TO goldshop_user;

--
-- TOC entry 225 (class 1259 OID 18858)
-- Name: alert_rules; Type: TABLE; Schema: analytics; Owner: goldshop_user
--

CREATE TABLE analytics.alert_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rule_name character varying(100) NOT NULL,
    rule_type character varying(50) NOT NULL,
    conditions jsonb NOT NULL,
    severity character varying(20) DEFAULT 'medium'::character varying,
    notification_channels jsonb,
    is_active boolean DEFAULT true,
    cooldown_minutes integer DEFAULT 60,
    escalation_rules jsonb,
    created_by uuid NOT NULL,
    last_triggered timestamp with time zone,
    trigger_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE analytics.alert_rules OWNER TO goldshop_user;

--
-- TOC entry 219 (class 1259 OID 18773)
-- Name: analytics_cache; Type: TABLE; Schema: analytics; Owner: goldshop_user
--

CREATE TABLE analytics.analytics_cache (
    cache_key character varying(255) NOT NULL,
    data jsonb NOT NULL,
    ttl integer NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    cache_type character varying(50) NOT NULL,
    entity_type character varying(50),
    entity_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE analytics.analytics_cache OWNER TO goldshop_user;

--
-- TOC entry 224 (class 1259 OID 18847)
-- Name: backup_logs; Type: TABLE; Schema: analytics; Owner: goldshop_user
--

CREATE TABLE analytics.backup_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    backup_type character varying(30) NOT NULL,
    backup_status character varying(20) NOT NULL,
    backup_size_bytes bigint,
    backup_location character varying(500),
    encryption_used boolean DEFAULT false,
    compression_used boolean DEFAULT false,
    verification_status character varying(20),
    error_message text,
    started_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    retention_until date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE analytics.backup_logs OWNER TO goldshop_user;

--
-- TOC entry 222 (class 1259 OID 18815)
-- Name: category_performance; Type: TABLE; Schema: analytics; Owner: goldshop_user
--

CREATE TABLE analytics.category_performance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    analysis_date date NOT NULL,
    revenue numeric(15,2) DEFAULT 0,
    units_sold integer DEFAULT 0,
    profit_margin numeric(5,2) DEFAULT 0,
    inventory_turnover numeric(8,4) DEFAULT 0,
    velocity_score numeric(3,2) DEFAULT 0,
    movement_classification text DEFAULT 'normal'::text,
    seasonal_factor numeric(6,4) DEFAULT 1.0,
    cross_selling_score numeric(3,2) DEFAULT 0,
    performance_trend text DEFAULT 'stable'::text,
    recommendations jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE analytics.category_performance OWNER TO goldshop_user;

--
-- TOC entry 221 (class 1259 OID 18798)
-- Name: cost_analysis; Type: TABLE; Schema: analytics; Owner: goldshop_user
--

CREATE TABLE analytics.cost_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    analysis_date date NOT NULL,
    carrying_cost numeric(12,2) DEFAULT 0,
    ordering_cost numeric(12,2) DEFAULT 0,
    stockout_cost numeric(12,2) DEFAULT 0,
    total_cost numeric(12,2) DEFAULT 0,
    cost_per_unit numeric(10,4) DEFAULT 0,
    cost_breakdown jsonb,
    optimization_potential numeric(12,2) DEFAULT 0,
    recommendations jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE analytics.cost_analysis OWNER TO goldshop_user;

--
-- TOC entry 218 (class 1259 OID 18761)
-- Name: custom_reports; Type: TABLE; Schema: analytics; Owner: goldshop_user
--

CREATE TABLE analytics.custom_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    report_type character varying(50) NOT NULL,
    data_sources jsonb NOT NULL,
    filters jsonb,
    visualizations jsonb NOT NULL,
    layout jsonb,
    styling jsonb,
    schedule_config jsonb,
    is_scheduled boolean DEFAULT false,
    is_public boolean DEFAULT false,
    created_by uuid NOT NULL,
    shared_with jsonb,
    last_generated timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE analytics.custom_reports OWNER TO goldshop_user;

--
-- TOC entry 217 (class 1259 OID 18748)
-- Name: demand_forecasts; Type: TABLE; Schema: analytics; Owner: goldshop_user
--

CREATE TABLE analytics.demand_forecasts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    forecast_date date NOT NULL,
    forecast_period text NOT NULL,
    predicted_demand numeric(10,2) NOT NULL,
    confidence_interval_lower numeric(10,2),
    confidence_interval_upper numeric(10,2),
    confidence_score numeric(5,4),
    model_used text NOT NULL,
    accuracy_score numeric(5,4),
    seasonal_factor numeric(6,4) DEFAULT 1.0,
    trend_component numeric(8,4) DEFAULT 0,
    historical_data jsonb,
    external_factors jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE analytics.demand_forecasts OWNER TO goldshop_user;

--
-- TOC entry 227 (class 1259 OID 18886)
-- Name: image_management; Type: TABLE; Schema: analytics; Owner: goldshop_user
--

CREATE TABLE analytics.image_management (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    original_filename character varying(255) NOT NULL,
    stored_filename character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size_bytes integer NOT NULL,
    mime_type character varying(100) NOT NULL,
    image_width integer,
    image_height integer,
    thumbnails jsonb,
    is_primary boolean DEFAULT false,
    alt_text character varying(255),
    caption text,
    sort_order integer DEFAULT 0,
    optimization_applied boolean DEFAULT false,
    compression_ratio numeric(5,4),
    upload_metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE analytics.image_management OWNER TO goldshop_user;

--
-- TOC entry 216 (class 1259 OID 18737)
-- Name: kpi_snapshots; Type: TABLE; Schema: analytics; Owner: goldshop_user
--

CREATE TABLE analytics.kpi_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kpi_type text NOT NULL,
    kpi_name text NOT NULL,
    value numeric(15,4) NOT NULL,
    target_value numeric(15,4),
    achievement_rate numeric(5,2),
    trend_direction text,
    variance_percentage numeric(8,4),
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE analytics.kpi_snapshots OWNER TO goldshop_user;

--
-- TOC entry 223 (class 1259 OID 18835)
-- Name: performance_metrics; Type: TABLE; Schema: analytics; Owner: goldshop_user
--

CREATE TABLE analytics.performance_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    metric_type text NOT NULL,
    metric_name text NOT NULL,
    value numeric(15,4) NOT NULL,
    unit text,
    threshold_value numeric(15,4),
    status text DEFAULT 'normal'::text,
    service_name text,
    endpoint text,
    additional_data jsonb,
    recorded_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE analytics.performance_metrics OWNER TO goldshop_user;

--
-- TOC entry 220 (class 1259 OID 18781)
-- Name: stock_optimization_recommendations; Type: TABLE; Schema: analytics; Owner: goldshop_user
--

CREATE TABLE analytics.stock_optimization_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    recommendation_type character varying(30) NOT NULL,
    current_stock integer NOT NULL,
    recommended_stock integer,
    reorder_point integer,
    reorder_quantity integer,
    safety_stock integer,
    max_stock_level integer,
    economic_order_quantity integer,
    lead_time_days integer DEFAULT 7,
    holding_cost_per_unit numeric(10,4) DEFAULT 0,
    ordering_cost numeric(10,2) DEFAULT 0,
    stockout_cost numeric(10,2) DEFAULT 0,
    confidence_score numeric(3,2) DEFAULT 0,
    reasoning text,
    priority_level character varying(10) DEFAULT 'medium'::character varying,
    estimated_savings numeric(12,2) DEFAULT 0,
    implementation_date date,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp with time zone
);


ALTER TABLE analytics.stock_optimization_recommendations OWNER TO goldshop_user;

--
-- TOC entry 231 (class 1259 OID 20119)
-- Name: accounting_entries; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.accounting_entries (
    id uuid NOT NULL,
    entry_type character varying(20) NOT NULL,
    category character varying(50) NOT NULL,
    amount numeric(12,2),
    weight_grams numeric(10,3),
    description text NOT NULL,
    reference_id uuid,
    reference_type character varying(50),
    transaction_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.accounting_entries OWNER TO goldshop_user;

--
-- TOC entry 268 (class 1259 OID 20659)
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO goldshop_user;

--
-- TOC entry 266 (class 1259 OID 20611)
-- Name: alert_history; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.alert_history (
    id uuid NOT NULL,
    rule_id uuid NOT NULL,
    alert_level character varying(20) NOT NULL,
    message text NOT NULL,
    triggered_value numeric(15,4),
    threshold_value numeric(15,4),
    entity_type character varying(50),
    entity_id uuid,
    notification_sent boolean,
    acknowledged boolean,
    acknowledged_by uuid,
    acknowledged_at timestamp with time zone,
    resolved boolean,
    resolved_at timestamp with time zone,
    additional_data jsonb,
    triggered_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.alert_history OWNER TO goldshop_user;

--
-- TOC entry 262 (class 1259 OID 20539)
-- Name: alert_rules; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.alert_rules (
    id uuid NOT NULL,
    rule_name character varying(100) NOT NULL,
    rule_type character varying(50) NOT NULL,
    conditions jsonb NOT NULL,
    severity character varying(20),
    notification_channels jsonb,
    is_active boolean,
    cooldown_minutes integer,
    escalation_rules jsonb,
    created_by uuid NOT NULL,
    last_triggered timestamp with time zone,
    trigger_count integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.alert_rules OWNER TO goldshop_user;

--
-- TOC entry 238 (class 1259 OID 20188)
-- Name: analytics_cache; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.analytics_cache (
    cache_key character varying(255) NOT NULL,
    data jsonb NOT NULL,
    ttl integer NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    cache_type character varying(50) NOT NULL,
    entity_type character varying(50),
    entity_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.analytics_cache OWNER TO goldshop_user;

--
-- TOC entry 234 (class 1259 OID 20147)
-- Name: analytics_data; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.analytics_data (
    id uuid NOT NULL,
    data_type character varying(50) NOT NULL,
    entity_type character varying(50),
    entity_id uuid,
    metric_name character varying(100) NOT NULL,
    metric_value numeric(15,4) NOT NULL,
    additional_data jsonb,
    calculation_date timestamp with time zone NOT NULL,
    calculated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.analytics_data OWNER TO goldshop_user;

--
-- TOC entry 241 (class 1259 OID 20212)
-- Name: backup_logs; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.backup_logs (
    id uuid NOT NULL,
    backup_type character varying(30) NOT NULL,
    backup_status character varying(20) NOT NULL,
    backup_size_bytes integer,
    backup_location character varying(500),
    encryption_used boolean,
    compression_used boolean,
    verification_status character varying(20),
    error_message text,
    started_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    retention_until date,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.backup_logs OWNER TO goldshop_user;

--
-- TOC entry 229 (class 1259 OID 20083)
-- Name: categories; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.categories (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    parent_id uuid,
    description text,
    icon character varying(50),
    color character varying(7),
    attributes jsonb,
    category_metadata jsonb,
    sort_order integer,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO goldshop_user;

--
-- TOC entry 248 (class 1259 OID 20308)
-- Name: category_performance; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.category_performance (
    id uuid NOT NULL,
    category_id uuid NOT NULL,
    analysis_date date NOT NULL,
    revenue numeric(15,2),
    units_sold integer,
    profit_margin numeric(5,2),
    inventory_turnover numeric(8,4),
    velocity_score numeric(3,2),
    movement_classification character varying(20),
    seasonal_factor numeric(6,4),
    cross_selling_score numeric(3,2),
    performance_trend character varying(15),
    recommendations jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.category_performance OWNER TO goldshop_user;

--
-- TOC entry 249 (class 1259 OID 20321)
-- Name: category_templates; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.category_templates (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    template_data jsonb NOT NULL,
    is_active boolean,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.category_templates OWNER TO goldshop_user;

--
-- TOC entry 232 (class 1259 OID 20130)
-- Name: company_settings; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.company_settings (
    id uuid NOT NULL,
    company_name character varying(200),
    company_logo_url character varying(500),
    company_address text,
    default_gold_price numeric(10,2),
    default_labor_percentage numeric(5,2),
    default_profit_percentage numeric(5,2),
    default_vat_percentage numeric(5,2),
    invoice_template jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT check_labor_percentage CHECK (((default_labor_percentage >= (0)::numeric) AND (default_labor_percentage <= (100)::numeric))),
    CONSTRAINT check_profit_percentage CHECK (((default_profit_percentage >= (0)::numeric) AND (default_profit_percentage <= (100)::numeric))),
    CONSTRAINT check_vat_percentage CHECK (((default_vat_percentage >= (0)::numeric) AND (default_vat_percentage <= (100)::numeric)))
);


ALTER TABLE public.company_settings OWNER TO goldshop_user;

--
-- TOC entry 239 (class 1259 OID 20196)
-- Name: cost_analysis; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.cost_analysis (
    id uuid NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid,
    analysis_date date NOT NULL,
    carrying_cost numeric(12,2),
    ordering_cost numeric(12,2),
    stockout_cost numeric(12,2),
    total_cost numeric(12,2),
    cost_per_unit numeric(10,4),
    cost_breakdown jsonb,
    optimization_potential numeric(12,2),
    recommendations jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.cost_analysis OWNER TO goldshop_user;

--
-- TOC entry 256 (class 1259 OID 20441)
-- Name: custom_reports; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.custom_reports (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    report_config jsonb NOT NULL,
    is_template boolean,
    is_public boolean,
    last_generated_at timestamp with time zone,
    generation_count integer,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.custom_reports OWNER TO goldshop_user;

--
-- TOC entry 247 (class 1259 OID 20291)
-- Name: customer_behavior_analysis; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.customer_behavior_analysis (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    analysis_period_start timestamp with time zone NOT NULL,
    analysis_period_end timestamp with time zone NOT NULL,
    purchase_frequency numeric(5,2),
    average_order_value numeric(12,2),
    total_spent numeric(15,2),
    customer_lifetime_value numeric(15,2),
    last_purchase_date timestamp with time zone,
    days_since_last_purchase integer,
    preferred_categories jsonb,
    preferred_payment_method character varying(50),
    risk_score numeric(3,2),
    loyalty_score numeric(3,2),
    engagement_score numeric(3,2),
    churn_probability numeric(3,2),
    predicted_next_purchase timestamp without time zone,
    seasonal_patterns jsonb,
    calculated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT check_churn_probability CHECK (((churn_probability >= (0)::numeric) AND (churn_probability <= (1)::numeric))),
    CONSTRAINT check_engagement_score CHECK (((engagement_score >= (0)::numeric) AND (engagement_score <= (1)::numeric))),
    CONSTRAINT check_loyalty_score CHECK (((loyalty_score >= (0)::numeric) AND (loyalty_score <= (1)::numeric))),
    CONSTRAINT check_risk_score CHECK (((risk_score >= (0)::numeric) AND (risk_score <= (1)::numeric)))
);


ALTER TABLE public.customer_behavior_analysis OWNER TO goldshop_user;

--
-- TOC entry 265 (class 1259 OID 20592)
-- Name: customer_segment_assignments; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.customer_segment_assignments (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    segment_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    assignment_score numeric(5,2),
    is_primary boolean
);


ALTER TABLE public.customer_segment_assignments OWNER TO goldshop_user;

--
-- TOC entry 254 (class 1259 OID 20407)
-- Name: customer_segments; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.customer_segments (
    id uuid NOT NULL,
    segment_name character varying(100) NOT NULL,
    segment_description text,
    segment_criteria jsonb NOT NULL,
    segment_color character varying(7),
    is_active boolean,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.customer_segments OWNER TO goldshop_user;

--
-- TOC entry 230 (class 1259 OID 20100)
-- Name: customers; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.customers (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    phone character varying(20),
    email character varying(100),
    address text,
    street_address character varying(255),
    city character varying(100),
    state character varying(100),
    postal_code character varying(20),
    country character varying(100),
    national_id character varying(50),
    date_of_birth date,
    age integer,
    gender character varying(20),
    nationality character varying(100),
    occupation character varying(100),
    emergency_contact_name character varying(200),
    emergency_contact_phone character varying(20),
    emergency_contact_relationship character varying(50),
    notes text,
    tags jsonb,
    custom_fields jsonb,
    preferences jsonb,
    customer_type character varying(50),
    credit_limit numeric(12,2),
    payment_terms integer,
    discount_percentage numeric(5,2),
    tax_exempt boolean,
    tax_id character varying(50),
    total_purchases numeric(12,2),
    current_debt numeric(12,2),
    last_purchase_date timestamp with time zone,
    is_active boolean,
    blacklisted boolean,
    blacklist_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.customers OWNER TO goldshop_user;

--
-- TOC entry 259 (class 1259 OID 20490)
-- Name: demand_forecasting; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.demand_forecasting (
    id uuid NOT NULL,
    item_id uuid NOT NULL,
    forecast_period_start date NOT NULL,
    forecast_period_end date NOT NULL,
    forecast_type character varying(20) NOT NULL,
    historical_data jsonb,
    predicted_demand numeric(10,2) NOT NULL,
    confidence_interval_lower numeric(10,2),
    confidence_interval_upper numeric(10,2),
    forecast_accuracy numeric(5,2),
    seasonal_patterns jsonb,
    trend_component numeric(8,4),
    forecast_method character varying(30),
    external_factors jsonb,
    generated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.demand_forecasting OWNER TO goldshop_user;

--
-- TOC entry 261 (class 1259 OID 20526)
-- Name: demand_forecasts; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.demand_forecasts (
    id uuid NOT NULL,
    item_id uuid NOT NULL,
    forecast_date date NOT NULL,
    forecast_period character varying(20) NOT NULL,
    predicted_demand numeric(10,2) NOT NULL,
    confidence_interval_lower numeric(10,2),
    confidence_interval_upper numeric(10,2),
    confidence_score numeric(5,4),
    model_used character varying(50) NOT NULL,
    accuracy_score numeric(5,4),
    seasonal_factor numeric(6,4),
    trend_component numeric(8,4),
    historical_data jsonb,
    external_factors jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.demand_forecasts OWNER TO goldshop_user;

--
-- TOC entry 263 (class 1259 OID 20553)
-- Name: forecast_models; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.forecast_models (
    id uuid NOT NULL,
    item_id uuid NOT NULL,
    model_type character varying(50) NOT NULL,
    confidence_score numeric(5,4) NOT NULL,
    accuracy_metrics jsonb,
    training_date date NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.forecast_models OWNER TO goldshop_user;

--
-- TOC entry 242 (class 1259 OID 20220)
-- Name: image_management; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.image_management (
    id uuid NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    original_filename character varying(255) NOT NULL,
    stored_filename character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size_bytes integer NOT NULL,
    mime_type character varying(100) NOT NULL,
    image_width integer,
    image_height integer,
    thumbnails jsonb,
    is_primary boolean,
    alt_text character varying(255),
    caption text,
    sort_order integer,
    optimization_applied boolean,
    compression_ratio numeric(5,4),
    upload_metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.image_management OWNER TO goldshop_user;

--
-- TOC entry 245 (class 1259 OID 20257)
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.inventory_items (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    category_id uuid,
    weight_grams numeric(10,3) NOT NULL,
    purchase_price numeric(12,2) NOT NULL,
    sell_price numeric(12,2) NOT NULL,
    stock_quantity integer NOT NULL,
    min_stock_level integer,
    description text,
    image_url character varying(500),
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inventory_items OWNER TO goldshop_user;

--
-- TOC entry 243 (class 1259 OID 20232)
-- Name: inventory_performance_metrics; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.inventory_performance_metrics (
    id uuid NOT NULL,
    metric_date date NOT NULL,
    total_inventory_value numeric(15,2),
    total_items_count integer,
    fast_moving_items_count integer,
    slow_moving_items_count integer,
    dead_stock_items_count integer,
    average_turnover_ratio numeric(8,4),
    inventory_to_sales_ratio numeric(6,4),
    carrying_cost_percentage numeric(5,2),
    stockout_incidents integer,
    overstock_incidents integer,
    optimization_score numeric(3,2),
    total_holding_cost numeric(12,2),
    total_ordering_cost numeric(12,2),
    total_stockout_cost numeric(12,2),
    efficiency_rating character varying(15),
    calculated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inventory_performance_metrics OWNER TO goldshop_user;

--
-- TOC entry 257 (class 1259 OID 20458)
-- Name: inventory_turnover_analysis; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.inventory_turnover_analysis (
    id uuid NOT NULL,
    item_id uuid NOT NULL,
    analysis_period_start timestamp with time zone NOT NULL,
    analysis_period_end timestamp with time zone NOT NULL,
    units_sold integer,
    average_stock numeric(10,2),
    turnover_ratio numeric(8,4),
    velocity_score numeric(3,2),
    movement_classification character varying(20),
    days_to_stockout integer,
    seasonal_factor numeric(4,2),
    trend_direction character varying(15),
    last_sale_date timestamp with time zone,
    calculated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inventory_turnover_analysis OWNER TO goldshop_user;

--
-- TOC entry 250 (class 1259 OID 20335)
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.invoice_items (
    id uuid NOT NULL,
    invoice_id uuid,
    inventory_item_id uuid,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    weight_grams numeric(10,3) NOT NULL
);


ALTER TABLE public.invoice_items OWNER TO goldshop_user;

--
-- TOC entry 246 (class 1259 OID 20274)
-- Name: invoices; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.invoices (
    id uuid NOT NULL,
    invoice_number character varying(50) NOT NULL,
    customer_id uuid,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2),
    remaining_amount numeric(12,2) NOT NULL,
    gold_price_per_gram numeric(10,2) NOT NULL,
    labor_cost_percentage numeric(5,2),
    profit_percentage numeric(5,2),
    vat_percentage numeric(5,2),
    status character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.invoices OWNER TO goldshop_user;

--
-- TOC entry 237 (class 1259 OID 20180)
-- Name: kpi_snapshots; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.kpi_snapshots (
    id uuid NOT NULL,
    kpi_type character varying(50) NOT NULL,
    kpi_name character varying(100) NOT NULL,
    value numeric(15,4) NOT NULL,
    target_value numeric(15,4),
    achievement_rate numeric(5,2),
    trend_direction character varying(10),
    variance_percentage numeric(8,4),
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    kpi_metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.kpi_snapshots OWNER TO goldshop_user;

--
-- TOC entry 253 (class 1259 OID 20393)
-- Name: kpi_targets; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.kpi_targets (
    id uuid NOT NULL,
    kpi_type character varying(50) NOT NULL,
    kpi_name character varying(100) NOT NULL,
    target_period character varying(20) NOT NULL,
    target_value numeric(15,2) NOT NULL,
    current_value numeric(15,2),
    achievement_rate numeric(5,2),
    trend_direction character varying(10),
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    is_active boolean,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.kpi_targets OWNER TO goldshop_user;

--
-- TOC entry 236 (class 1259 OID 20170)
-- Name: margin_analysis; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.margin_analysis (
    id uuid NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid,
    analysis_date timestamp without time zone NOT NULL,
    target_margin numeric(5,2),
    actual_margin numeric(5,2),
    margin_variance numeric(5,2),
    revenue_impact numeric(12,2),
    cost_factors jsonb,
    margin_trend character varying(20),
    recommendations jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.margin_analysis OWNER TO goldshop_user;

--
-- TOC entry 251 (class 1259 OID 20350)
-- Name: payments; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.payments (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    invoice_id uuid,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(20),
    description text,
    payment_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO goldshop_user;

--
-- TOC entry 240 (class 1259 OID 20204)
-- Name: performance_metrics; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.performance_metrics (
    id uuid NOT NULL,
    metric_type character varying(50) NOT NULL,
    metric_name character varying(100) NOT NULL,
    value numeric(15,4) NOT NULL,
    unit character varying(20),
    threshold_value numeric(15,4),
    status character varying(20),
    service_name character varying(50),
    endpoint character varying(200),
    additional_data jsonb,
    recorded_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.performance_metrics OWNER TO goldshop_user;

--
-- TOC entry 235 (class 1259 OID 20158)
-- Name: profitability_analysis; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.profitability_analysis (
    id uuid NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid,
    analysis_period_start timestamp with time zone NOT NULL,
    analysis_period_end timestamp with time zone NOT NULL,
    total_revenue numeric(15,2) NOT NULL,
    total_cost numeric(15,2) NOT NULL,
    gross_profit numeric(15,2) NOT NULL,
    profit_margin numeric(5,2) NOT NULL,
    markup_percentage numeric(5,2) NOT NULL,
    units_sold integer,
    average_selling_price numeric(12,2),
    average_cost_price numeric(12,2),
    profit_per_unit numeric(12,2),
    additional_metrics jsonb,
    calculated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.profitability_analysis OWNER TO goldshop_user;

--
-- TOC entry 267 (class 1259 OID 20633)
-- Name: report_executions; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.report_executions (
    id uuid NOT NULL,
    report_id uuid NOT NULL,
    execution_type character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    export_format character varying(20),
    file_path character varying(500),
    file_size integer,
    generation_time_seconds integer,
    error_message text,
    parameters jsonb,
    task_metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);


ALTER TABLE public.report_executions OWNER TO goldshop_user;

--
-- TOC entry 228 (class 1259 OID 20073)
-- Name: roles; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.roles (
    id uuid NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    permissions jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO goldshop_user;

--
-- TOC entry 255 (class 1259 OID 20424)
-- Name: scheduled_reports; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.scheduled_reports (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    report_config jsonb NOT NULL,
    schedule_config jsonb NOT NULL,
    recipients jsonb NOT NULL,
    export_formats jsonb,
    is_active boolean,
    next_run_at timestamp with time zone,
    last_run_at timestamp with time zone,
    last_success_at timestamp with time zone,
    run_count integer,
    error_count integer,
    last_error text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.scheduled_reports OWNER TO goldshop_user;

--
-- TOC entry 260 (class 1259 OID 20506)
-- Name: seasonal_analysis; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.seasonal_analysis (
    id uuid NOT NULL,
    item_id uuid,
    category_id uuid,
    analysis_type character varying(20) NOT NULL,
    season character varying(20) NOT NULL,
    year integer NOT NULL,
    baseline_demand numeric(10,2),
    seasonal_factor numeric(6,4),
    peak_period_start date,
    peak_period_end date,
    demand_variance numeric(8,4),
    confidence_level numeric(3,2),
    recommendations jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.seasonal_analysis OWNER TO goldshop_user;

--
-- TOC entry 252 (class 1259 OID 20372)
-- Name: sms_campaigns; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.sms_campaigns (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    template_id uuid,
    message_content text NOT NULL,
    total_recipients integer,
    sent_count integer,
    failed_count integer,
    status character varying(20),
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sms_campaigns OWNER TO goldshop_user;

--
-- TOC entry 264 (class 1259 OID 20569)
-- Name: sms_messages; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.sms_messages (
    id uuid NOT NULL,
    campaign_id uuid,
    customer_id uuid,
    phone_number character varying(20) NOT NULL,
    message_content text NOT NULL,
    status character varying(20),
    delivery_status character varying(20),
    gateway_message_id character varying(100),
    error_message text,
    retry_count integer,
    max_retries integer,
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sms_messages OWNER TO goldshop_user;

--
-- TOC entry 233 (class 1259 OID 20138)
-- Name: sms_templates; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.sms_templates (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    template_type character varying(20) NOT NULL,
    message_template text NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sms_templates OWNER TO goldshop_user;

--
-- TOC entry 258 (class 1259 OID 20473)
-- Name: stock_optimization_recommendations; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.stock_optimization_recommendations (
    id uuid NOT NULL,
    item_id uuid NOT NULL,
    recommendation_type character varying(30) NOT NULL,
    current_stock integer NOT NULL,
    recommended_stock integer,
    reorder_point integer,
    reorder_quantity integer,
    safety_stock integer,
    max_stock_level integer,
    economic_order_quantity integer,
    lead_time_days integer,
    holding_cost_per_unit numeric(10,4),
    ordering_cost numeric(10,2),
    stockout_cost numeric(10,2),
    confidence_score numeric(3,2),
    reasoning text,
    priority_level character varying(10),
    estimated_savings numeric(12,2),
    implementation_date date,
    status character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);


ALTER TABLE public.stock_optimization_recommendations OWNER TO goldshop_user;

--
-- TOC entry 244 (class 1259 OID 20241)
-- Name: users; Type: TABLE; Schema: public; Owner: goldshop_user
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role_id uuid,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO goldshop_user;

--
-- TOC entry 4014 (class 0 OID 18872)
-- Dependencies: 226
-- Data for Name: alert_history; Type: TABLE DATA; Schema: analytics; Owner: goldshop_user
--

COPY analytics.alert_history (id, rule_id, alert_level, message, triggered_value, threshold_value, entity_type, entity_id, notification_sent, acknowledged, acknowledged_by, acknowledged_at, resolved, resolved_at, additional_data, triggered_at, created_at) FROM stdin;
\.


--
-- TOC entry 4013 (class 0 OID 18858)
-- Dependencies: 225
-- Data for Name: alert_rules; Type: TABLE DATA; Schema: analytics; Owner: goldshop_user
--

COPY analytics.alert_rules (id, rule_name, rule_type, conditions, severity, notification_channels, is_active, cooldown_minutes, escalation_rules, created_by, last_triggered, trigger_count, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4007 (class 0 OID 18773)
-- Dependencies: 219
-- Data for Name: analytics_cache; Type: TABLE DATA; Schema: analytics; Owner: goldshop_user
--

COPY analytics.analytics_cache (cache_key, data, ttl, expires_at, cache_type, entity_type, entity_id, created_at) FROM stdin;
\.


--
-- TOC entry 4012 (class 0 OID 18847)
-- Dependencies: 224
-- Data for Name: backup_logs; Type: TABLE DATA; Schema: analytics; Owner: goldshop_user
--

COPY analytics.backup_logs (id, backup_type, backup_status, backup_size_bytes, backup_location, encryption_used, compression_used, verification_status, error_message, started_at, completed_at, retention_until, created_at) FROM stdin;
\.


--
-- TOC entry 4010 (class 0 OID 18815)
-- Dependencies: 222
-- Data for Name: category_performance; Type: TABLE DATA; Schema: analytics; Owner: goldshop_user
--

COPY analytics.category_performance (id, category_id, analysis_date, revenue, units_sold, profit_margin, inventory_turnover, velocity_score, movement_classification, seasonal_factor, cross_selling_score, performance_trend, recommendations, created_at) FROM stdin;
\.


--
-- TOC entry 4009 (class 0 OID 18798)
-- Dependencies: 221
-- Data for Name: cost_analysis; Type: TABLE DATA; Schema: analytics; Owner: goldshop_user
--

COPY analytics.cost_analysis (id, entity_type, entity_id, analysis_date, carrying_cost, ordering_cost, stockout_cost, total_cost, cost_per_unit, cost_breakdown, optimization_potential, recommendations, created_at) FROM stdin;
\.


--
-- TOC entry 4006 (class 0 OID 18761)
-- Dependencies: 218
-- Data for Name: custom_reports; Type: TABLE DATA; Schema: analytics; Owner: goldshop_user
--

COPY analytics.custom_reports (id, name, description, report_type, data_sources, filters, visualizations, layout, styling, schedule_config, is_scheduled, is_public, created_by, shared_with, last_generated, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4005 (class 0 OID 18748)
-- Dependencies: 217
-- Data for Name: demand_forecasts; Type: TABLE DATA; Schema: analytics; Owner: goldshop_user
--

COPY analytics.demand_forecasts (id, item_id, forecast_date, forecast_period, predicted_demand, confidence_interval_lower, confidence_interval_upper, confidence_score, model_used, accuracy_score, seasonal_factor, trend_component, historical_data, external_factors, created_at) FROM stdin;
\.


--
-- TOC entry 4015 (class 0 OID 18886)
-- Dependencies: 227
-- Data for Name: image_management; Type: TABLE DATA; Schema: analytics; Owner: goldshop_user
--

COPY analytics.image_management (id, entity_type, entity_id, original_filename, stored_filename, file_path, file_size_bytes, mime_type, image_width, image_height, thumbnails, is_primary, alt_text, caption, sort_order, optimization_applied, compression_ratio, upload_metadata, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4004 (class 0 OID 18737)
-- Dependencies: 216
-- Data for Name: kpi_snapshots; Type: TABLE DATA; Schema: analytics; Owner: goldshop_user
--

COPY analytics.kpi_snapshots (id, kpi_type, kpi_name, value, target_value, achievement_rate, trend_direction, variance_percentage, period_start, period_end, metadata, created_at) FROM stdin;
\.


--
-- TOC entry 4011 (class 0 OID 18835)
-- Dependencies: 223
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: analytics; Owner: goldshop_user
--

COPY analytics.performance_metrics (id, metric_type, metric_name, value, unit, threshold_value, status, service_name, endpoint, additional_data, recorded_at, created_at) FROM stdin;
\.


--
-- TOC entry 4008 (class 0 OID 18781)
-- Dependencies: 220
-- Data for Name: stock_optimization_recommendations; Type: TABLE DATA; Schema: analytics; Owner: goldshop_user
--

COPY analytics.stock_optimization_recommendations (id, item_id, recommendation_type, current_stock, recommended_stock, reorder_point, reorder_quantity, safety_stock, max_stock_level, economic_order_quantity, lead_time_days, holding_cost_per_unit, ordering_cost, stockout_cost, confidence_score, reasoning, priority_level, estimated_savings, implementation_date, status, created_at, expires_at) FROM stdin;
\.


--
-- TOC entry 4019 (class 0 OID 20119)
-- Dependencies: 231
-- Data for Name: accounting_entries; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.accounting_entries (id, entry_type, category, amount, weight_grams, description, reference_id, reference_type, transaction_date, created_at) FROM stdin;
\.


--
-- TOC entry 4056 (class 0 OID 20659)
-- Dependencies: 268
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.alembic_version (version_num) FROM stdin;
c9e1d5f57c3a
\.


--
-- TOC entry 4054 (class 0 OID 20611)
-- Dependencies: 266
-- Data for Name: alert_history; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.alert_history (id, rule_id, alert_level, message, triggered_value, threshold_value, entity_type, entity_id, notification_sent, acknowledged, acknowledged_by, acknowledged_at, resolved, resolved_at, additional_data, triggered_at, created_at) FROM stdin;
\.


--
-- TOC entry 4050 (class 0 OID 20539)
-- Dependencies: 262
-- Data for Name: alert_rules; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.alert_rules (id, rule_name, rule_type, conditions, severity, notification_channels, is_active, cooldown_minutes, escalation_rules, created_by, last_triggered, trigger_count, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4026 (class 0 OID 20188)
-- Dependencies: 238
-- Data for Name: analytics_cache; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.analytics_cache (cache_key, data, ttl, expires_at, cache_type, entity_type, entity_id, created_at) FROM stdin;
\.


--
-- TOC entry 4022 (class 0 OID 20147)
-- Dependencies: 234
-- Data for Name: analytics_data; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.analytics_data (id, data_type, entity_type, entity_id, metric_name, metric_value, additional_data, calculation_date, calculated_at) FROM stdin;
\.


--
-- TOC entry 4029 (class 0 OID 20212)
-- Dependencies: 241
-- Data for Name: backup_logs; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.backup_logs (id, backup_type, backup_status, backup_size_bytes, backup_location, encryption_used, compression_used, verification_status, error_message, started_at, completed_at, retention_until, created_at) FROM stdin;
\.


--
-- TOC entry 4017 (class 0 OID 20083)
-- Dependencies: 229
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.categories (id, name, parent_id, description, icon, color, attributes, category_metadata, sort_order, is_active, created_at, updated_at) FROM stdin;
5a868a3b-86a0-4e78-8d12-02e67a6d2fb7	Rings	\N	Gold rings and wedding bands	\N	\N	\N	\N	0	t	2025-08-28 19:37:03.04557+00	2025-08-28 19:37:03.04557+00
d05aced6-aec8-42b8-8a41-6a7f7a09e341	Necklaces	\N	Gold necklaces and chains	\N	\N	\N	\N	0	t	2025-08-28 19:37:03.04557+00	2025-08-28 19:37:03.04557+00
1f95f0ff-18ed-426a-a10c-593c0441b5d6	Bracelets	\N	Gold bracelets and bangles	\N	\N	\N	\N	0	t	2025-08-28 19:37:03.04557+00	2025-08-28 19:37:03.04557+00
a803b7d6-23b4-4e2c-b8aa-2a6e02a273b3	Earrings	\N	Gold earrings	\N	\N	\N	\N	0	t	2025-08-28 19:37:03.04557+00	2025-08-28 19:37:03.04557+00
6e8e6bc0-541b-45b7-bad4-a507ad6698f7	Coins	\N	Gold coins and bullion	\N	\N	\N	\N	0	t	2025-08-28 19:37:03.04557+00	2025-08-28 19:37:03.04557+00
63d264ee-b294-4d7c-9a86-a9ddd6e52162	Rings	\N	Gold rings and wedding bands	💍	#FFD700	\N	\N	0	t	2025-08-28 19:37:17.121737+00	2025-08-28 19:37:17.121737+00
fa2bf80e-b1dd-462c-85a9-13449b975f12	Necklaces	\N	Gold necklaces and chains	📿	#FFA500	\N	\N	1	t	2025-08-28 19:37:17.121737+00	2025-08-28 19:37:17.121737+00
568e0d02-1eb5-4b3c-a3e3-bb0911407ad9	Bracelets	\N	Gold bracelets and bangles	⚡	#FF8C00	\N	\N	2	t	2025-08-28 19:37:17.121737+00	2025-08-28 19:37:17.121737+00
0501d2c8-57d8-4528-8685-e86993e11d99	Earrings	\N	Gold earrings and studs	💎	#DAA520	\N	\N	3	t	2025-08-28 19:37:17.121737+00	2025-08-28 19:37:17.121737+00
daa5661c-73ce-4c73-8d23-ea81ef11e02b	Coins	\N	Gold coins and bullion	🪙	#B8860B	\N	\N	4	t	2025-08-28 19:37:17.121737+00	2025-08-28 19:37:17.121737+00
8f494899-7508-48fd-a529-d16bc12432eb	Watches	\N	Gold watches and timepieces	⌚	#CD853F	\N	\N	5	t	2025-08-28 19:37:17.121737+00	2025-08-28 19:37:17.121737+00
da1223ae-5699-48b6-959c-eeff39e597d0	Pendants	\N	Gold pendants and charms	🔮	#DEB887	\N	\N	6	t	2025-08-28 19:37:17.121737+00	2025-08-28 19:37:17.121737+00
14b8ec3a-cd49-412d-93b2-05cb6d52316d	Sets	\N	Complete jewelry sets	💫	#F4A460	\N	\N	7	t	2025-08-28 19:37:17.121737+00	2025-08-28 19:37:17.121737+00
\.


--
-- TOC entry 4036 (class 0 OID 20308)
-- Dependencies: 248
-- Data for Name: category_performance; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.category_performance (id, category_id, analysis_date, revenue, units_sold, profit_margin, inventory_turnover, velocity_score, movement_classification, seasonal_factor, cross_selling_score, performance_trend, recommendations, created_at) FROM stdin;
\.


--
-- TOC entry 4037 (class 0 OID 20321)
-- Dependencies: 249
-- Data for Name: category_templates; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.category_templates (id, name, description, template_data, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4020 (class 0 OID 20130)
-- Dependencies: 232
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.company_settings (id, company_name, company_logo_url, company_address, default_gold_price, default_labor_percentage, default_profit_percentage, default_vat_percentage, invoice_template, updated_at) FROM stdin;
5780f6f0-1e07-4f03-9c4f-c2383235bb87	Gold Shop	\N	\N	50.00	10.00	15.00	9.00	\N	2025-08-28 19:37:03.04557+00
\.


--
-- TOC entry 4027 (class 0 OID 20196)
-- Dependencies: 239
-- Data for Name: cost_analysis; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.cost_analysis (id, entity_type, entity_id, analysis_date, carrying_cost, ordering_cost, stockout_cost, total_cost, cost_per_unit, cost_breakdown, optimization_potential, recommendations, created_at) FROM stdin;
\.


--
-- TOC entry 4044 (class 0 OID 20441)
-- Dependencies: 256
-- Data for Name: custom_reports; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.custom_reports (id, name, description, report_config, is_template, is_public, last_generated_at, generation_count, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4035 (class 0 OID 20291)
-- Dependencies: 247
-- Data for Name: customer_behavior_analysis; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.customer_behavior_analysis (id, customer_id, analysis_period_start, analysis_period_end, purchase_frequency, average_order_value, total_spent, customer_lifetime_value, last_purchase_date, days_since_last_purchase, preferred_categories, preferred_payment_method, risk_score, loyalty_score, engagement_score, churn_probability, predicted_next_purchase, seasonal_patterns, calculated_at) FROM stdin;
\.


--
-- TOC entry 4053 (class 0 OID 20592)
-- Dependencies: 265
-- Data for Name: customer_segment_assignments; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.customer_segment_assignments (id, customer_id, segment_id, assigned_at, assignment_score, is_primary) FROM stdin;
\.


--
-- TOC entry 4042 (class 0 OID 20407)
-- Dependencies: 254
-- Data for Name: customer_segments; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.customer_segments (id, segment_name, segment_description, segment_criteria, segment_color, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4018 (class 0 OID 20100)
-- Dependencies: 230
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.customers (id, name, phone, email, address, street_address, city, state, postal_code, country, national_id, date_of_birth, age, gender, nationality, occupation, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, notes, tags, custom_fields, preferences, customer_type, credit_limit, payment_terms, discount_percentage, tax_exempt, tax_id, total_purchases, current_debt, last_purchase_date, is_active, blacklisted, blacklist_reason, created_at, updated_at) FROM stdin;
bfe1f85d-dad0-438f-8ede-1c7bee2e4434	Ahmad Hassan	+98-912-345-6789	ahmad.hassan@email.com	Tehran, Valiasr Street, No. 123	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	18486.56	0	0.00	f	\N	0.00	1689.49	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
534e43ab-e637-41a3-9801-57595eb808ab	Fatima Karimi	+98-913-456-7890	fatima.karimi@email.com	Isfahan, Chahar Bagh Street, No. 456	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	32806.80	0	0.00	f	\N	0.00	2666.99	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
91063c7c-da51-4ee4-a4c4-d4c2d23cb5d0	Mohammad Rezaei	+98-914-567-8901	mohammad.rezaei@email.com	Shiraz, Zand Street, No. 789	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	47002.93	0	0.00	f	\N	0.00	114.12	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
54bec49a-8b00-4097-afbd-0061be6ce6c7	Zahra Ahmadi	+98-915-678-9012	zahra.ahmadi@email.com	Mashhad, Imam Reza Street, No. 321	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	11321.63	0	0.00	f	\N	0.00	2934.50	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
333bb711-668e-4f4a-8035-6b78af73604c	Ali Moradi	+98-916-789-0123	ali.moradi@email.com	Tabriz, Baghmisheh Street, No. 654	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	42326.49	0	0.00	f	\N	0.00	2210.34	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
d96d89d7-d380-480f-90c3-5eea785e8c65	Maryam Hosseini	+98-917-890-1234	maryam.hosseini@email.com	Kerman, Azadi Square, No. 987	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	11835.61	0	0.00	f	\N	0.00	3339.81	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
ccbafc2c-27d0-4785-9e27-1b773d91c42c	Reza Ghorbani	+98-918-901-2345	reza.ghorbani@email.com	Yazd, Amir Chakhmaq Square, No. 147	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	30247.40	0	0.00	f	\N	0.00	3307.75	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
906a8df0-26d2-418a-991c-1225d2ae0e45	Soghra Bahrami	+98-919-012-3456	soghra.bahrami@email.com	Qom, Hazrat Masumeh Street, No. 258	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	10121.46	0	0.00	f	\N	0.00	4267.79	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
fe1b1240-9c6e-42bf-905f-47527f05d7dc	Hassan Jafari	+98-920-123-4567	hassan.jafari@email.com	Ahvaz, Kianpars Street, No. 369	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	47935.76	0	0.00	f	\N	0.00	520.27	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
c4c2dc48-9a05-49ce-ae26-24ab51dc89cb	Narges Rahmani	+98-921-234-5678	narges.rahmani@email.com	Rasht, Golsar Street, No. 741	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	49089.79	0	0.00	f	\N	0.00	2340.21	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
b80aca81-ad75-4ce9-8a3d-0a5842a6f737	Mehdi Kazemi	+98-922-345-6789	mehdi.kazemi@email.com	Karaj, Gohardasht Street, No. 852	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	36042.46	0	0.00	f	\N	0.00	1487.97	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
7985ae89-8c7d-48af-826f-b84a8183a551	Leila Mousavi	+98-923-456-7890	leila.mousavi@email.com	Urmia, Resalat Street, No. 963	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	41575.03	0	0.00	f	\N	0.00	1558.37	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
812f3b51-f56b-48f2-901f-2bd296dcf65e	Javad Sadeghi	+98-924-567-8901	javad.sadeghi@email.com	Arak, Basij Square, No. 159	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	31712.39	0	0.00	f	\N	0.00	715.13	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
4ab3ece9-59c4-47e0-bed8-b26f425dd6a5	Fatemeh Zare	+98-925-678-9012	fatemeh.zare@email.com	Bandar Abbas, Emam Khomeini Street, No. 357	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	24573.03	0	0.00	f	\N	0.00	3370.35	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
529bd7a8-0f07-4f1e-afba-5338bada7e9d	Saeed Rahimi	+98-926-789-0123	saeed.rahimi@email.com	Sari, Taleghani Street, No. 468	\N	\N	\N	\N	United States	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	12181.74	0	0.00	f	\N	0.00	944.43	\N	t	f	\N	2025-08-28 19:37:17.17558+00	2025-08-28 19:37:17.17558+00
\.


--
-- TOC entry 4047 (class 0 OID 20490)
-- Dependencies: 259
-- Data for Name: demand_forecasting; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.demand_forecasting (id, item_id, forecast_period_start, forecast_period_end, forecast_type, historical_data, predicted_demand, confidence_interval_lower, confidence_interval_upper, forecast_accuracy, seasonal_patterns, trend_component, forecast_method, external_factors, generated_at, created_at) FROM stdin;
\.


--
-- TOC entry 4049 (class 0 OID 20526)
-- Dependencies: 261
-- Data for Name: demand_forecasts; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.demand_forecasts (id, item_id, forecast_date, forecast_period, predicted_demand, confidence_interval_lower, confidence_interval_upper, confidence_score, model_used, accuracy_score, seasonal_factor, trend_component, historical_data, external_factors, created_at) FROM stdin;
\.


--
-- TOC entry 4051 (class 0 OID 20553)
-- Dependencies: 263
-- Data for Name: forecast_models; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.forecast_models (id, item_id, model_type, confidence_score, accuracy_metrics, training_date, is_active, created_at) FROM stdin;
\.


--
-- TOC entry 4030 (class 0 OID 20220)
-- Dependencies: 242
-- Data for Name: image_management; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.image_management (id, entity_type, entity_id, original_filename, stored_filename, file_path, file_size_bytes, mime_type, image_width, image_height, thumbnails, is_primary, alt_text, caption, sort_order, optimization_applied, compression_ratio, upload_metadata, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4033 (class 0 OID 20257)
-- Dependencies: 245
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.inventory_items (id, name, category_id, weight_grams, purchase_price, sell_price, stock_quantity, min_stock_level, description, image_url, is_active, created_at, updated_at) FROM stdin;
66c69164-96ba-4261-a1fd-a00aa33cabb0	Classic Gold Wedding Band	63d264ee-b294-4d7c-9a86-a9ddd6e52162	5.200	291.52	850.00	19	3	High-quality 18K gold classic gold wedding band, Weight: 5.2g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
14cb7417-2355-4b61-9918-ba9c6d945e51	Diamond Engagement Ring	63d264ee-b294-4d7c-9a86-a9ddd6e52162	3.800	165.70	2500.00	19	5	High-quality 14K gold diamond engagement ring, Weight: 3.8g, Purity: 14K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
6f7f8a76-8da8-4b79-b05e-8510cb8c8a2c	Vintage Rose Gold Ring	63d264ee-b294-4d7c-9a86-a9ddd6e52162	4.100	229.86	1200.00	7	4	High-quality 18K gold vintage rose gold ring, Weight: 4.1g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
557bc8c5-54b9-4208-823d-c7804bbfe3cc	Men's Signet Ring	63d264ee-b294-4d7c-9a86-a9ddd6e52162	8.500	476.53	1800.00	8	4	High-quality 18K gold men's signet ring, Weight: 8.5g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
71cc34f8-76ef-438c-8ff6-5f0460c8ae86	Eternity Band with Diamonds	63d264ee-b294-4d7c-9a86-a9ddd6e52162	4.500	252.28	3200.00	11	2	High-quality 18K gold eternity band with diamonds, Weight: 4.5g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
7a6275f5-9845-40d8-b7b6-ad6abc25b22d	Gold Chain Necklace 24K	fa2bf80e-b1dd-462c-85a9-13449b975f12	15.300	1143.67	2800.00	1	1	High-quality 24K gold gold chain necklace 24k, Weight: 15.3g, Purity: 24K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
aac0b83c-fd14-4f63-ad90-717f23f46449	Pearl and Gold Necklace	fa2bf80e-b1dd-462c-85a9-13449b975f12	12.100	678.36	1950.00	19	1	High-quality 18K gold pearl and gold necklace, Weight: 12.1g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
a8880522-7f56-4249-b7d1-13cf43487640	Byzantine Chain	fa2bf80e-b1dd-462c-85a9-13449b975f12	18.700	1281.34	3500.00	6	4	High-quality 22K gold byzantine chain, Weight: 18.7g, Purity: 22K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
c5b2b652-9cc6-4ef1-bc62-068e3f5809a7	Delicate Gold Chain	fa2bf80e-b1dd-462c-85a9-13449b975f12	6.200	270.35	680.00	20	3	High-quality 14K gold delicate gold chain, Weight: 6.2g, Purity: 14K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
882cda47-1531-45ca-bfcd-80b66c0a8896	Statement Gold Collar	fa2bf80e-b1dd-462c-85a9-13449b975f12	25.400	1423.99	4200.00	5	1	High-quality 18K gold statement gold collar, Weight: 25.4g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
ee276604-106c-4a0b-8907-c1113b752a33	Tennis Bracelet	568e0d02-1eb5-4b3c-a3e3-bb0911407ad9	8.900	498.96	2200.00	3	4	High-quality 18K gold tennis bracelet, Weight: 8.9g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
69230c16-fb94-4961-b01c-8c927fbe4632	Gold Bangle Set	568e0d02-1eb5-4b3c-a3e3-bb0911407ad9	22.100	1514.31	3800.00	2	5	High-quality 22K gold gold bangle set, Weight: 22.1g, Purity: 22K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
37c393c2-f9d8-4e20-91a0-c3f83f002140	Charm Bracelet	568e0d02-1eb5-4b3c-a3e3-bb0911407ad9	12.300	536.33	1100.00	1	4	High-quality 14K gold charm bracelet, Weight: 12.3g, Purity: 14K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
aa759cda-f430-4c65-93a2-97951e6330ad	Link Chain Bracelet	568e0d02-1eb5-4b3c-a3e3-bb0911407ad9	14.700	824.12	1850.00	11	1	High-quality 18K gold link chain bracelet, Weight: 14.7g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
97310014-4384-4720-8cbe-dc79c1d2d543	Cuff Bracelet	568e0d02-1eb5-4b3c-a3e3-bb0911407ad9	18.200	1020.34	2650.00	16	4	High-quality 18K gold cuff bracelet, Weight: 18.2g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
1c76a4f2-0f5b-4376-acac-65bf746f729d	Diamond Stud Earrings	0501d2c8-57d8-4528-8685-e86993e11d99	2.100	117.73	1500.00	4	4	High-quality 18K gold diamond stud earrings, Weight: 2.1g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
fa080668-bfc0-4d0e-b3d9-40546d7f8f18	Gold Hoop Earrings	0501d2c8-57d8-4528-8685-e86993e11d99	4.300	187.50	420.00	8	3	High-quality 14K gold gold hoop earrings, Weight: 4.3g, Purity: 14K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
aa1dba88-77d1-430f-9972-1a41e4d0ef91	Chandelier Earrings	0501d2c8-57d8-4528-8685-e86993e11d99	6.800	381.23	1800.00	3	1	High-quality 18K gold chandelier earrings, Weight: 6.8g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
24ff4d45-2501-4dd0-b3bd-7203da313506	Pearl Drop Earrings	0501d2c8-57d8-4528-8685-e86993e11d99	3.200	179.40	950.00	8	1	High-quality 18K gold pearl drop earrings, Weight: 3.2g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
0aea4dbf-ca91-44bb-b457-82d40df15dfc	Geometric Gold Earrings	0501d2c8-57d8-4528-8685-e86993e11d99	5.100	222.38	680.00	8	5	High-quality 14K gold geometric gold earrings, Weight: 5.1g, Purity: 14K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
86c4db83-26ed-434b-bbf5-a09a42ecf6d6	1oz Gold Eagle Coin	daa5661c-73ce-4c73-8d23-ea81ef11e02b	31.100	2131.00	2100.00	17	4	High-quality 22K gold 1oz gold eagle coin, Weight: 31.1g, Purity: 22K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
c9571f1a-d261-44ee-9b97-c1c8dbb7efe1	1/2oz Gold Maple Leaf	daa5661c-73ce-4c73-8d23-ea81ef11e02b	15.550	1162.36	1050.00	6	1	High-quality 24K gold 1/2oz gold maple leaf, Weight: 15.55g, Purity: 24K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
fa145779-5817-43e8-b31e-822a5e90a90e	1/4oz Gold Krugerrand	daa5661c-73ce-4c73-8d23-ea81ef11e02b	7.780	533.09	525.00	9	3	High-quality 22K gold 1/4oz gold krugerrand, Weight: 7.78g, Purity: 22K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
7282d655-a4ae-4dbf-a958-f5dfa4982b63	1/10oz Gold Panda	daa5661c-73ce-4c73-8d23-ea81ef11e02b	3.110	232.47	210.00	14	1	High-quality 24K gold 1/10oz gold panda, Weight: 3.11g, Purity: 24K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
e793a652-c106-4b26-94e0-ad64d126e7a1	Gold Commemorative Coin	daa5661c-73ce-4c73-8d23-ea81ef11e02b	8.500	476.53	650.00	16	1	High-quality 18K gold gold commemorative coin, Weight: 8.5g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
60dd6b4b-9a46-4559-a9c2-36701b21886b	Classic Gold Watch	8f494899-7508-48fd-a529-d16bc12432eb	45.200	2534.03	5500.00	16	4	High-quality 18K gold classic gold watch, Weight: 45.2g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
cfff1e16-0909-4f9d-9814-468159e6ee91	Ladies Diamond Watch	8f494899-7508-48fd-a529-d16bc12432eb	32.100	1399.69	3200.00	1	2	High-quality 14K gold ladies diamond watch, Weight: 32.1g, Purity: 14K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
71d7a41f-b008-4be3-9276-d280f92c1402	Men's Sports Watch	8f494899-7508-48fd-a529-d16bc12432eb	52.800	2960.10	6800.00	15	4	High-quality 18K gold men's sports watch, Weight: 52.8g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
b99b5b2f-c934-4df0-b5f6-41575d52e834	Vintage Pocket Watch	8f494899-7508-48fd-a529-d16bc12432eb	38.500	1678.76	2800.00	12	5	High-quality 14K gold vintage pocket watch, Weight: 38.5g, Purity: 14K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
73e87541-1378-4a87-b899-fdfd11a88390	Heart Pendant	da1223ae-5699-48b6-959c-eeff39e597d0	3.200	179.40	450.00	18	3	High-quality 18K gold heart pendant, Weight: 3.2g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
d14adf52-4c21-4c89-b825-2e86d9966dff	Cross Pendant	da1223ae-5699-48b6-959c-eeff39e597d0	4.100	178.78	320.00	2	4	High-quality 14K gold cross pendant, Weight: 4.1g, Purity: 14K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
4ff11334-4af7-4de5-b57a-538f3abfaa98	Locket Pendant	da1223ae-5699-48b6-959c-eeff39e597d0	5.800	325.16	680.00	8	5	High-quality 18K gold locket pendant, Weight: 5.8g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
fe18566f-0cc0-4f9f-8a2c-ca4861dfb7cc	Gemstone Pendant	da1223ae-5699-48b6-959c-eeff39e597d0	6.200	347.59	1200.00	16	3	High-quality 18K gold gemstone pendant, Weight: 6.2g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
50807b4e-c888-466d-a26d-f2147cca2dde	Bridal Jewelry Set	14b8ec3a-cd49-412d-93b2-05cb6d52316d	35.200	1973.40	4500.00	16	3	High-quality 18K gold bridal jewelry set, Weight: 35.2g, Purity: 18K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
baa21583-b185-42d4-b0d5-67e67031d22f	Evening Jewelry Set	14b8ec3a-cd49-412d-93b2-05cb6d52316d	28.100	1225.28	2800.00	5	3	High-quality 14K gold evening jewelry set, Weight: 28.1g, Purity: 14K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
5cbaba74-80fb-4fbd-bbbc-f3b3bad053fd	Traditional Gold Set	14b8ec3a-cd49-412d-93b2-05cb6d52316d	42.500	2912.14	6200.00	3	3	High-quality 22K gold traditional gold set, Weight: 42.5g, Purity: 22K	\N	t	2025-08-28 19:37:17.248697+00	2025-08-28 19:37:17.248697+00
\.


--
-- TOC entry 4031 (class 0 OID 20232)
-- Dependencies: 243
-- Data for Name: inventory_performance_metrics; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.inventory_performance_metrics (id, metric_date, total_inventory_value, total_items_count, fast_moving_items_count, slow_moving_items_count, dead_stock_items_count, average_turnover_ratio, inventory_to_sales_ratio, carrying_cost_percentage, stockout_incidents, overstock_incidents, optimization_score, total_holding_cost, total_ordering_cost, total_stockout_cost, efficiency_rating, calculated_at, created_at) FROM stdin;
\.


--
-- TOC entry 4045 (class 0 OID 20458)
-- Dependencies: 257
-- Data for Name: inventory_turnover_analysis; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.inventory_turnover_analysis (id, item_id, analysis_period_start, analysis_period_end, units_sold, average_stock, turnover_ratio, velocity_score, movement_classification, days_to_stockout, seasonal_factor, trend_direction, last_sale_date, calculated_at, created_at) FROM stdin;
\.


--
-- TOC entry 4038 (class 0 OID 20335)
-- Dependencies: 250
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.invoice_items (id, invoice_id, inventory_item_id, quantity, unit_price, total_price, weight_grams) FROM stdin;
5f0436a3-ba23-459a-9cf0-d46226619c93	4602fe85-1441-4f26-8f64-393c5d5d23e2	baa21583-b185-42d4-b0d5-67e67031d22f	3	2800.00	8400.00	84.300
35f63013-2cd0-4a7f-a2bc-abb90680b34d	4602fe85-1441-4f26-8f64-393c5d5d23e2	e793a652-c106-4b26-94e0-ad64d126e7a1	3	650.00	1950.00	25.500
5881276e-643c-44c2-8db0-a7e7883a3033	4602fe85-1441-4f26-8f64-393c5d5d23e2	71d7a41f-b008-4be3-9276-d280f92c1402	1	6800.00	6800.00	52.800
0bcb4888-8f48-404a-90c3-9b1ac7e5514b	74f3095e-ee09-48f6-b28f-b054e02713fc	50807b4e-c888-466d-a26d-f2147cca2dde	2	4500.00	9000.00	70.400
7a28bfbd-312c-4ead-9e02-57467ca5b103	74f3095e-ee09-48f6-b28f-b054e02713fc	37c393c2-f9d8-4e20-91a0-c3f83f002140	2	1100.00	2200.00	24.600
5d0c8caa-bb91-4df9-aaca-9b7bf0a9ad44	74f3095e-ee09-48f6-b28f-b054e02713fc	a8880522-7f56-4249-b7d1-13cf43487640	1	3500.00	3500.00	18.700
296738ed-fade-4fb4-b87c-69ff173f64cd	74f3095e-ee09-48f6-b28f-b054e02713fc	c5b2b652-9cc6-4ef1-bc62-068e3f5809a7	2	680.00	1360.00	12.400
deabe0f0-e45f-4d3c-9576-00dc84bab235	831f2239-00c8-43cb-8d49-e6c4c145034d	baa21583-b185-42d4-b0d5-67e67031d22f	2	2800.00	5600.00	56.200
4deb8317-8594-41b9-a932-a04fc00e0e05	831f2239-00c8-43cb-8d49-e6c4c145034d	fe18566f-0cc0-4f9f-8a2c-ca4861dfb7cc	2	1200.00	2400.00	12.400
380fee85-2dba-4a7d-9ee7-3a297b8a42ff	831f2239-00c8-43cb-8d49-e6c4c145034d	c5b2b652-9cc6-4ef1-bc62-068e3f5809a7	2	680.00	1360.00	12.400
d9238dc6-4183-4845-a05f-52ad8ac82f5a	831f2239-00c8-43cb-8d49-e6c4c145034d	66c69164-96ba-4261-a1fd-a00aa33cabb0	3	850.00	2550.00	15.600
54600918-1ea3-45fc-882a-0c3652494dcf	831f2239-00c8-43cb-8d49-e6c4c145034d	d14adf52-4c21-4c89-b825-2e86d9966dff	3	320.00	960.00	12.300
c9f2b556-9d1b-44de-bad0-6c20011e23b5	0ed0f9a6-f91d-4a8b-9770-5b914679fb63	baa21583-b185-42d4-b0d5-67e67031d22f	1	2800.00	2800.00	28.100
58417f92-6732-4ec4-b626-4187df032bf5	0ed0f9a6-f91d-4a8b-9770-5b914679fb63	14cb7417-2355-4b61-9918-ba9c6d945e51	3	2500.00	7500.00	11.400
9a27e2fe-e876-4ea3-9ed2-71d480bcf0a6	45624ac4-5bc8-4530-bc83-87702e9b4484	882cda47-1531-45ca-bfcd-80b66c0a8896	3	4200.00	12600.00	76.200
983ce5ae-c46c-4502-a5d0-743b1f337900	45624ac4-5bc8-4530-bc83-87702e9b4484	aa1dba88-77d1-430f-9972-1a41e4d0ef91	3	1800.00	5400.00	20.400
252da6c4-9887-4d92-b91b-aed0c44ae381	5847f0b9-33df-4a08-9aa7-0dd14f632956	73e87541-1378-4a87-b899-fdfd11a88390	2	450.00	900.00	6.400
bc13e5cb-7cf0-48ad-a6fe-0cf85dec629f	5847f0b9-33df-4a08-9aa7-0dd14f632956	71d7a41f-b008-4be3-9276-d280f92c1402	3	6800.00	20400.00	158.400
2f9a8a43-a9bd-4c2e-8123-b8de7d463cd6	5847f0b9-33df-4a08-9aa7-0dd14f632956	7a6275f5-9845-40d8-b7b6-ad6abc25b22d	1	2800.00	2800.00	15.300
e46a3866-c039-404a-bdd0-4a762f5b7218	5847f0b9-33df-4a08-9aa7-0dd14f632956	0aea4dbf-ca91-44bb-b457-82d40df15dfc	2	680.00	1360.00	10.200
b6aa92dd-f497-418e-81f5-d231f0109b55	888d1499-7db5-497f-aa8a-26b23b1e6732	fa145779-5817-43e8-b31e-822a5e90a90e	3	525.00	1575.00	23.340
c92f075b-0eb7-4bcd-9f78-8804cd36feb1	888d1499-7db5-497f-aa8a-26b23b1e6732	7a6275f5-9845-40d8-b7b6-ad6abc25b22d	2	2800.00	5600.00	30.600
6536b41c-d658-418f-94ae-8775235c619f	888d1499-7db5-497f-aa8a-26b23b1e6732	37c393c2-f9d8-4e20-91a0-c3f83f002140	1	1100.00	1100.00	12.300
48388b43-856f-4e3d-9632-1f207ea78b80	888d1499-7db5-497f-aa8a-26b23b1e6732	1c76a4f2-0f5b-4376-acac-65bf746f729d	1	1500.00	1500.00	2.100
8af24981-bd0d-4756-8fe3-84c01b4407b5	37f9c1c0-a6b5-4ff7-a5aa-0228e0f10a76	5cbaba74-80fb-4fbd-bbbc-f3b3bad053fd	1	6200.00	6200.00	42.500
c2758310-ba6a-4f20-8141-06a586f71303	37f9c1c0-a6b5-4ff7-a5aa-0228e0f10a76	fa080668-bfc0-4d0e-b3d9-40546d7f8f18	1	420.00	420.00	4.300
04ad799a-db5b-40eb-b735-0697cae45322	812493c8-785e-4e97-b5e8-d15550a834f1	86c4db83-26ed-434b-bbf5-a09a42ecf6d6	1	2100.00	2100.00	31.100
6b6e4186-cba3-4c38-b9f8-899f2dcf0bc8	812493c8-785e-4e97-b5e8-d15550a834f1	c5b2b652-9cc6-4ef1-bc62-068e3f5809a7	2	680.00	1360.00	12.400
b4541e36-fdb7-4c54-a8f9-df2b3f4d84a1	812493c8-785e-4e97-b5e8-d15550a834f1	14cb7417-2355-4b61-9918-ba9c6d945e51	1	2500.00	2500.00	3.800
d6df5ed6-83a2-4d79-8317-ab069b9cd778	812493c8-785e-4e97-b5e8-d15550a834f1	97310014-4384-4720-8cbe-dc79c1d2d543	2	2650.00	5300.00	36.400
a9b1110e-01ab-4591-a0a5-aa2093060522	200eefd5-c080-4e04-b61c-8eb3157c6306	fe18566f-0cc0-4f9f-8a2c-ca4861dfb7cc	2	1200.00	2400.00	12.400
ca7d073c-4d5e-4547-8342-99585716fd32	6d904609-d86c-4a2e-9907-48c45c30a45c	97310014-4384-4720-8cbe-dc79c1d2d543	2	2650.00	5300.00	36.400
62d7bf22-19ef-4830-96a0-7bff87133ded	6d904609-d86c-4a2e-9907-48c45c30a45c	66c69164-96ba-4261-a1fd-a00aa33cabb0	3	850.00	2550.00	15.600
d6cd693e-c6e6-4976-a561-2013c26527ab	6d904609-d86c-4a2e-9907-48c45c30a45c	fa080668-bfc0-4d0e-b3d9-40546d7f8f18	2	420.00	840.00	8.600
6e6012cb-dfa8-46e0-bd7c-9a71a05f8104	6d904609-d86c-4a2e-9907-48c45c30a45c	69230c16-fb94-4961-b01c-8c927fbe4632	3	3800.00	11400.00	66.300
437bba7c-a3f4-4c1d-8db1-0aa2765c194b	c34171d9-cefc-450c-b3ab-7cb558396151	5cbaba74-80fb-4fbd-bbbc-f3b3bad053fd	2	6200.00	12400.00	85.000
4f504c46-00cd-401b-8089-d2a0b4731df7	4e8cd2a5-4174-452a-9cba-dba4e7da2c45	c5b2b652-9cc6-4ef1-bc62-068e3f5809a7	1	680.00	680.00	6.200
9f008b18-f9ab-48d8-8078-ac843fa545be	4e8cd2a5-4174-452a-9cba-dba4e7da2c45	e793a652-c106-4b26-94e0-ad64d126e7a1	1	650.00	650.00	8.500
2dfe7662-7faf-4872-80d9-308a2cde9828	429cc0d6-9b87-43bf-9881-e0dfe1a806c8	b99b5b2f-c934-4df0-b5f6-41575d52e834	1	2800.00	2800.00	38.500
6e3de754-3a0f-4f2c-b799-e7bf3bc86fd7	429cc0d6-9b87-43bf-9881-e0dfe1a806c8	aa759cda-f430-4c65-93a2-97951e6330ad	2	1850.00	3700.00	29.400
da682174-ca6d-42c8-8fca-6dd9f1cebba7	429cc0d6-9b87-43bf-9881-e0dfe1a806c8	c9571f1a-d261-44ee-9b97-c1c8dbb7efe1	3	1050.00	3150.00	46.650
73eaffdf-73d0-4e39-be95-7ccbe1d904ea	429cc0d6-9b87-43bf-9881-e0dfe1a806c8	aac0b83c-fd14-4f63-ad90-717f23f46449	2	1950.00	3900.00	24.200
76793470-9963-43b0-b8e1-2ebf03324d8e	f4fe9edd-5aad-4bed-b9ce-658f52dc6279	7282d655-a4ae-4dbf-a958-f5dfa4982b63	3	210.00	630.00	9.330
75e421e5-9066-465d-a9a4-c80811a62ce7	f4fe9edd-5aad-4bed-b9ce-658f52dc6279	0aea4dbf-ca91-44bb-b457-82d40df15dfc	3	680.00	2040.00	15.300
9e4a15b9-7570-42e2-9936-806785aed6ec	19113c00-5564-46d4-9e3b-86479b956c42	14cb7417-2355-4b61-9918-ba9c6d945e51	1	2500.00	2500.00	3.800
6d1717a1-f1ed-4d0c-b6eb-1b49ee186785	19113c00-5564-46d4-9e3b-86479b956c42	73e87541-1378-4a87-b899-fdfd11a88390	2	450.00	900.00	6.400
e567eb28-6578-4fc8-a4b5-7207be796124	19113c00-5564-46d4-9e3b-86479b956c42	d14adf52-4c21-4c89-b825-2e86d9966dff	2	320.00	640.00	8.200
5986bf5d-a03a-4ae2-820e-2cad93384b0e	19113c00-5564-46d4-9e3b-86479b956c42	ee276604-106c-4a0b-8907-c1113b752a33	3	2200.00	6600.00	26.700
28bdf83d-7fee-4980-901c-077a0247c28d	19113c00-5564-46d4-9e3b-86479b956c42	24ff4d45-2501-4dd0-b3bd-7203da313506	2	950.00	1900.00	6.400
46cb34bb-5ba4-44cc-91ef-d72cf67e5db3	bf7b4798-2318-48a1-aea2-3d1320313f64	aa759cda-f430-4c65-93a2-97951e6330ad	1	1850.00	1850.00	14.700
473b12ec-04d8-48a7-8129-36bdceb0b31f	bf7b4798-2318-48a1-aea2-3d1320313f64	fe18566f-0cc0-4f9f-8a2c-ca4861dfb7cc	3	1200.00	3600.00	18.600
c393078e-bcd2-4f92-a2a9-0f50f7ba6d5d	bf7b4798-2318-48a1-aea2-3d1320313f64	ee276604-106c-4a0b-8907-c1113b752a33	1	2200.00	2200.00	8.900
e882c943-7dae-433c-a422-d36dc0c5c130	bf7b4798-2318-48a1-aea2-3d1320313f64	71d7a41f-b008-4be3-9276-d280f92c1402	2	6800.00	13600.00	105.600
8a2b8ec9-48d1-48b8-bbef-211be2fb2b9a	96e4a81d-d7cb-4274-91cc-b15c3327622a	37c393c2-f9d8-4e20-91a0-c3f83f002140	3	1100.00	3300.00	36.900
76f9e879-76a7-4b52-8d45-5c67f6b2d2f7	96e4a81d-d7cb-4274-91cc-b15c3327622a	aa759cda-f430-4c65-93a2-97951e6330ad	1	1850.00	1850.00	14.700
efce55c7-50cd-4959-ad58-f2c74abe720d	96e4a81d-d7cb-4274-91cc-b15c3327622a	71cc34f8-76ef-438c-8ff6-5f0460c8ae86	2	3200.00	6400.00	9.000
49b00d4e-3001-4627-ba3a-49f084b625ac	96e4a81d-d7cb-4274-91cc-b15c3327622a	557bc8c5-54b9-4208-823d-c7804bbfe3cc	3	1800.00	5400.00	25.500
3abcf430-586d-40ec-ad48-67464706ebb3	96e4a81d-d7cb-4274-91cc-b15c3327622a	a8880522-7f56-4249-b7d1-13cf43487640	1	3500.00	3500.00	18.700
3a77dbd5-a8a9-47ca-9a00-054b1e2590f5	7fc1b33d-e2cf-4b5d-b862-d95dbc2032da	baa21583-b185-42d4-b0d5-67e67031d22f	3	2800.00	8400.00	84.300
9feed1af-78c0-4270-9951-45c35cb684cd	7fc1b33d-e2cf-4b5d-b862-d95dbc2032da	c9571f1a-d261-44ee-9b97-c1c8dbb7efe1	1	1050.00	1050.00	15.550
23847a02-3179-4177-8b0b-313b055534bd	bfee9f48-9abb-4581-8535-72b4f11aa365	86c4db83-26ed-434b-bbf5-a09a42ecf6d6	1	2100.00	2100.00	31.100
1b9d3d19-4292-4621-99db-7aa5e4095500	bfee9f48-9abb-4581-8535-72b4f11aa365	b99b5b2f-c934-4df0-b5f6-41575d52e834	3	2800.00	8400.00	115.500
eaa247ed-a333-46a7-b457-c02fc298ce56	bfee9f48-9abb-4581-8535-72b4f11aa365	c5b2b652-9cc6-4ef1-bc62-068e3f5809a7	2	680.00	1360.00	12.400
497dfa95-93b6-43b9-bc00-43465a7a8831	bfee9f48-9abb-4581-8535-72b4f11aa365	ee276604-106c-4a0b-8907-c1113b752a33	2	2200.00	4400.00	17.800
8aa86b07-a322-4833-a30b-eb190c16d149	feb2662e-f560-441e-9833-5a3ed02e64ae	50807b4e-c888-466d-a26d-f2147cca2dde	3	4500.00	13500.00	105.600
09caa676-a5b3-48e7-989f-4d226dbf5d11	feb2662e-f560-441e-9833-5a3ed02e64ae	d14adf52-4c21-4c89-b825-2e86d9966dff	3	320.00	960.00	12.300
18c94f9a-e471-40f6-97c3-ae8d7099469e	6fa018bf-1acb-47f5-a99c-168eee639e51	fa080668-bfc0-4d0e-b3d9-40546d7f8f18	3	420.00	1260.00	12.900
de13ad75-ca51-48d5-a046-c6975d68bc34	6fa018bf-1acb-47f5-a99c-168eee639e51	73e87541-1378-4a87-b899-fdfd11a88390	3	450.00	1350.00	9.600
816fa29a-b70a-4eea-a759-c9f75916fa86	6fa018bf-1acb-47f5-a99c-168eee639e51	50807b4e-c888-466d-a26d-f2147cca2dde	3	4500.00	13500.00	105.600
71885ce8-0df8-45a2-9bac-a2b59a2612a6	6fa018bf-1acb-47f5-a99c-168eee639e51	69230c16-fb94-4961-b01c-8c927fbe4632	1	3800.00	3800.00	22.100
fdf53269-ecea-4a92-b42b-74abe36a7e8c	e7e09c4a-d5a3-4fbd-a283-839b5f39386a	0aea4dbf-ca91-44bb-b457-82d40df15dfc	3	680.00	2040.00	15.300
faebeb50-fc29-43a2-8582-9367ceeb9e1a	e7e09c4a-d5a3-4fbd-a283-839b5f39386a	14cb7417-2355-4b61-9918-ba9c6d945e51	2	2500.00	5000.00	7.600
ab4706d5-2310-471c-9cf5-fbbb42b82d26	c366e68b-8849-45f3-bee9-c7b7575d4f39	cfff1e16-0909-4f9d-9814-468159e6ee91	3	3200.00	9600.00	96.300
1f8305a3-a22d-433e-8d3f-175595d2a839	ab05ac11-07b4-4150-9873-0666323c2630	97310014-4384-4720-8cbe-dc79c1d2d543	3	2650.00	7950.00	54.600
ec264a77-bfd2-4f84-85c0-c99f1add0d92	ab05ac11-07b4-4150-9873-0666323c2630	fe18566f-0cc0-4f9f-8a2c-ca4861dfb7cc	3	1200.00	3600.00	18.600
aa79db29-2034-4720-8aed-0d3724e0cb16	ab05ac11-07b4-4150-9873-0666323c2630	aa1dba88-77d1-430f-9972-1a41e4d0ef91	3	1800.00	5400.00	20.400
\.


--
-- TOC entry 4034 (class 0 OID 20274)
-- Dependencies: 246
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.invoices (id, invoice_number, customer_id, total_amount, paid_amount, remaining_amount, gold_price_per_gram, labor_cost_percentage, profit_percentage, vat_percentage, status, created_at, updated_at) FROM stdin;
4602fe85-1441-4f26-8f64-393c5d5d23e2	INV-2024-1000	c4c2dc48-9a05-49ce-ae26-24ab51dc89cb	17150.00	10623.16	6526.84	65.00	15.00	20.00	9.00	pending	2025-08-14 19:37:17.307706+00	2025-08-28 19:37:17.304445+00
74f3095e-ee09-48f6-b28f-b054e02713fc	INV-2024-1001	bfe1f85d-dad0-438f-8ede-1c7bee2e4434	16060.00	0.00	16060.00	65.00	15.00	20.00	9.00	overdue	2025-08-22 19:37:17.313355+00	2025-08-28 19:37:17.304445+00
831f2239-00c8-43cb-8d49-e6c4c145034d	INV-2024-1002	534e43ab-e637-41a3-9801-57595eb808ab	12870.00	8379.66	4490.34	65.00	15.00	20.00	9.00	pending	2025-08-09 19:37:17.31931+00	2025-08-28 19:37:17.304445+00
0ed0f9a6-f91d-4a8b-9770-5b914679fb63	INV-2024-1003	b80aca81-ad75-4ce9-8a3d-0a5842a6f737	10300.00	10300.00	0.00	65.00	15.00	20.00	9.00	paid	2025-07-22 19:37:17.322509+00	2025-08-28 19:37:17.304445+00
45624ac4-5bc8-4530-bc83-87702e9b4484	INV-2024-1004	bfe1f85d-dad0-438f-8ede-1c7bee2e4434	18000.00	18000.00	0.00	65.00	15.00	20.00	9.00	paid	2025-07-07 19:37:17.32413+00	2025-08-28 19:37:17.304445+00
5847f0b9-33df-4a08-9aa7-0dd14f632956	INV-2024-1005	534e43ab-e637-41a3-9801-57595eb808ab	25460.00	19938.69	5521.31	65.00	15.00	20.00	9.00	pending	2025-08-22 19:37:17.325583+00	2025-08-28 19:37:17.304445+00
888d1499-7db5-497f-aa8a-26b23b1e6732	INV-2024-1006	d96d89d7-d380-480f-90c3-5eea785e8c65	9775.00	6754.50	3020.50	65.00	15.00	20.00	9.00	pending	2025-06-07 19:37:17.327715+00	2025-08-28 19:37:17.304445+00
37f9c1c0-a6b5-4ff7-a5aa-0228e0f10a76	INV-2024-1007	4ab3ece9-59c4-47e0-bed8-b26f425dd6a5	6620.00	6620.00	0.00	65.00	15.00	20.00	9.00	paid	2025-08-16 19:37:17.330211+00	2025-08-28 19:37:17.304445+00
812493c8-785e-4e97-b5e8-d15550a834f1	INV-2024-1008	4ab3ece9-59c4-47e0-bed8-b26f425dd6a5	11260.00	0.00	11260.00	65.00	15.00	20.00	9.00	overdue	2025-07-05 19:37:17.334452+00	2025-08-28 19:37:17.304445+00
200eefd5-c080-4e04-b61c-8eb3157c6306	INV-2024-1009	534e43ab-e637-41a3-9801-57595eb808ab	2400.00	0.00	2400.00	65.00	15.00	20.00	9.00	overdue	2025-06-21 19:37:17.336868+00	2025-08-28 19:37:17.304445+00
6d904609-d86c-4a2e-9907-48c45c30a45c	INV-2024-1010	ccbafc2c-27d0-4785-9e27-1b773d91c42c	20090.00	20090.00	0.00	65.00	15.00	20.00	9.00	paid	2025-07-12 19:37:17.336975+00	2025-08-28 19:37:17.304445+00
c34171d9-cefc-450c-b3ab-7cb558396151	INV-2024-1011	54bec49a-8b00-4097-afbd-0061be6ce6c7	12400.00	12400.00	0.00	65.00	15.00	20.00	9.00	paid	2025-07-28 19:37:17.338803+00	2025-08-28 19:37:17.304445+00
4e8cd2a5-4174-452a-9cba-dba4e7da2c45	INV-2024-1012	ccbafc2c-27d0-4785-9e27-1b773d91c42c	1330.00	746.27	583.73	65.00	15.00	20.00	9.00	pending	2025-08-20 19:37:17.339948+00	2025-08-28 19:37:17.304445+00
429cc0d6-9b87-43bf-9881-e0dfe1a806c8	INV-2024-1013	54bec49a-8b00-4097-afbd-0061be6ce6c7	13550.00	13550.00	0.00	65.00	15.00	20.00	9.00	paid	2025-08-26 19:37:17.340103+00	2025-08-28 19:37:17.304445+00
f4fe9edd-5aad-4bed-b9ce-658f52dc6279	INV-2024-1014	ccbafc2c-27d0-4785-9e27-1b773d91c42c	2670.00	2670.00	0.00	65.00	15.00	20.00	9.00	paid	2025-08-11 19:37:17.343266+00	2025-08-28 19:37:17.304445+00
19113c00-5564-46d4-9e3b-86479b956c42	INV-2024-1015	bfe1f85d-dad0-438f-8ede-1c7bee2e4434	12540.00	0.00	12540.00	65.00	15.00	20.00	9.00	overdue	2025-06-12 19:37:17.344179+00	2025-08-28 19:37:17.304445+00
bf7b4798-2318-48a1-aea2-3d1320313f64	INV-2024-1016	4ab3ece9-59c4-47e0-bed8-b26f425dd6a5	21250.00	0.00	21250.00	65.00	15.00	20.00	9.00	overdue	2025-07-10 19:37:17.345967+00	2025-08-28 19:37:17.304445+00
96e4a81d-d7cb-4274-91cc-b15c3327622a	INV-2024-1017	333bb711-668e-4f4a-8035-6b78af73604c	20450.00	7072.56	13377.44	65.00	15.00	20.00	9.00	pending	2025-06-20 19:37:17.346165+00	2025-08-28 19:37:17.304445+00
7fc1b33d-e2cf-4b5d-b862-d95dbc2032da	INV-2024-1018	4ab3ece9-59c4-47e0-bed8-b26f425dd6a5	9450.00	0.00	9450.00	65.00	15.00	20.00	9.00	overdue	2025-07-10 19:37:17.348576+00	2025-08-28 19:37:17.304445+00
bfee9f48-9abb-4581-8535-72b4f11aa365	INV-2024-1019	c4c2dc48-9a05-49ce-ae26-24ab51dc89cb	16260.00	16260.00	0.00	65.00	15.00	20.00	9.00	paid	2025-06-12 19:37:17.348694+00	2025-08-28 19:37:17.304445+00
feb2662e-f560-441e-9833-5a3ed02e64ae	INV-2024-1020	d96d89d7-d380-480f-90c3-5eea785e8c65	14460.00	10256.95	4203.05	65.00	15.00	20.00	9.00	pending	2025-05-30 19:37:17.34886+00	2025-08-28 19:37:17.304445+00
6fa018bf-1acb-47f5-a99c-168eee639e51	INV-2024-1021	54bec49a-8b00-4097-afbd-0061be6ce6c7	19910.00	14814.46	5095.54	65.00	15.00	20.00	9.00	pending	2025-07-29 19:37:17.348986+00	2025-08-28 19:37:17.304445+00
e7e09c4a-d5a3-4fbd-a283-839b5f39386a	INV-2024-1022	529bd7a8-0f07-4f1e-afba-5338bada7e9d	7040.00	4802.30	2237.70	65.00	15.00	20.00	9.00	pending	2025-06-14 19:37:17.349154+00	2025-08-28 19:37:17.304445+00
c366e68b-8849-45f3-bee9-c7b7575d4f39	INV-2024-1023	529bd7a8-0f07-4f1e-afba-5338bada7e9d	9600.00	3442.95	6157.05	65.00	15.00	20.00	9.00	pending	2025-08-17 19:37:17.350866+00	2025-08-28 19:37:17.304445+00
ab05ac11-07b4-4150-9873-0666323c2630	INV-2024-1024	812f3b51-f56b-48f2-901f-2bd296dcf65e	16950.00	16950.00	0.00	65.00	15.00	20.00	9.00	paid	2025-07-15 19:37:17.352039+00	2025-08-28 19:37:17.304445+00
\.


--
-- TOC entry 4025 (class 0 OID 20180)
-- Dependencies: 237
-- Data for Name: kpi_snapshots; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.kpi_snapshots (id, kpi_type, kpi_name, value, target_value, achievement_rate, trend_direction, variance_percentage, period_start, period_end, kpi_metadata, created_at) FROM stdin;
\.


--
-- TOC entry 4041 (class 0 OID 20393)
-- Dependencies: 253
-- Data for Name: kpi_targets; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.kpi_targets (id, kpi_type, kpi_name, target_period, target_value, current_value, achievement_rate, trend_direction, period_start, period_end, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4024 (class 0 OID 20170)
-- Dependencies: 236
-- Data for Name: margin_analysis; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.margin_analysis (id, entity_type, entity_id, analysis_date, target_margin, actual_margin, margin_variance, revenue_impact, cost_factors, margin_trend, recommendations, created_at) FROM stdin;
\.


--
-- TOC entry 4039 (class 0 OID 20350)
-- Dependencies: 251
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.payments (id, customer_id, invoice_id, amount, payment_method, description, payment_date, created_at) FROM stdin;
3285c626-54e9-4fff-8a6b-5938f794b2a1	c4c2dc48-9a05-49ce-ae26-24ab51dc89cb	4602fe85-1441-4f26-8f64-393c5d5d23e2	11066.60	bank	Partial payment received	2025-08-14 19:37:17.307706+00	2025-08-28 19:37:17.410719+00
ff470ce4-1aba-4787-a093-002ca5fc697a	534e43ab-e637-41a3-9801-57595eb808ab	831f2239-00c8-43cb-8d49-e6c4c145034d	9009.87	cash	Partial payment received	2025-08-16 19:37:17.31931+00	2025-08-28 19:37:17.410719+00
c046d01b-67da-4725-ad38-1bb929de1695	b80aca81-ad75-4ce9-8a3d-0a5842a6f737	0ed0f9a6-f91d-4a8b-9770-5b914679fb63	10300.00	cash	Full payment received	2025-08-14 19:37:17.322509+00	2025-08-28 19:37:17.410719+00
6580cc9f-d1cf-4f4c-a8f1-fabac38909a1	bfe1f85d-dad0-438f-8ede-1c7bee2e4434	45624ac4-5bc8-4530-bc83-87702e9b4484	18000.00	cash	Full payment received	2025-07-09 19:37:17.32413+00	2025-08-28 19:37:17.410719+00
2515b52c-1c91-45b0-ad5f-a909e4858664	534e43ab-e637-41a3-9801-57595eb808ab	5847f0b9-33df-4a08-9aa7-0dd14f632956	17169.22	card	Partial payment received	2025-09-01 19:37:17.325583+00	2025-08-28 19:37:17.410719+00
a3f9774b-c264-4819-879b-934c0f77d106	d96d89d7-d380-480f-90c3-5eea785e8c65	888d1499-7db5-497f-aa8a-26b23b1e6732	7565.00	card	Partial payment received	2025-06-19 19:37:17.327715+00	2025-08-28 19:37:17.410719+00
e2ca611e-eb2c-4776-89b7-380118af8d0e	4ab3ece9-59c4-47e0-bed8-b26f425dd6a5	37f9c1c0-a6b5-4ff7-a5aa-0228e0f10a76	6620.00	bank	Full payment received	2025-09-02 19:37:17.330211+00	2025-08-28 19:37:17.410719+00
3d6db644-93b8-4171-a572-823d8dd3f921	ccbafc2c-27d0-4785-9e27-1b773d91c42c	6d904609-d86c-4a2e-9907-48c45c30a45c	20090.00	cash	Full payment received	2025-07-31 19:37:17.336975+00	2025-08-28 19:37:17.410719+00
455fddbe-f003-4500-807e-46f2de2b2378	54bec49a-8b00-4097-afbd-0061be6ce6c7	c34171d9-cefc-450c-b3ab-7cb558396151	12400.00	bank	Full payment received	2025-07-28 19:37:17.338803+00	2025-08-28 19:37:17.410719+00
35ea5417-39bd-405a-afc2-71bf1e854a58	ccbafc2c-27d0-4785-9e27-1b773d91c42c	4e8cd2a5-4174-452a-9cba-dba4e7da2c45	989.30	bank	Partial payment received	2025-09-01 19:37:17.339948+00	2025-08-28 19:37:17.410719+00
3bb57638-40ca-404b-8c04-cddede6a09bb	54bec49a-8b00-4097-afbd-0061be6ce6c7	429cc0d6-9b87-43bf-9881-e0dfe1a806c8	13550.00	bank	Full payment received	2025-09-20 19:37:17.340103+00	2025-08-28 19:37:17.410719+00
8aba11a2-c4ec-4799-93c9-a3376c67c8e0	ccbafc2c-27d0-4785-9e27-1b773d91c42c	f4fe9edd-5aad-4bed-b9ce-658f52dc6279	2670.00	card	Full payment received	2025-08-26 19:37:17.343266+00	2025-08-28 19:37:17.410719+00
700e7ddb-63ec-4194-adc5-844612f237e6	333bb711-668e-4f4a-8035-6b78af73604c	96e4a81d-d7cb-4274-91cc-b15c3327622a	15062.79	bank	Partial payment received	2025-07-01 19:37:17.346165+00	2025-08-28 19:37:17.410719+00
27d800fd-5d19-4e28-90f4-586bacf76903	c4c2dc48-9a05-49ce-ae26-24ab51dc89cb	bfee9f48-9abb-4581-8535-72b4f11aa365	16260.00	cash	Full payment received	2025-06-15 19:37:17.348694+00	2025-08-28 19:37:17.410719+00
aa968a17-af9c-4fac-a77f-61e1ab421857	d96d89d7-d380-480f-90c3-5eea785e8c65	feb2662e-f560-441e-9833-5a3ed02e64ae	8411.42	cash	Partial payment received	2025-06-05 19:37:17.34886+00	2025-08-28 19:37:17.410719+00
3e2fc0ee-8154-46e5-93c1-96311c48ea62	54bec49a-8b00-4097-afbd-0061be6ce6c7	6fa018bf-1acb-47f5-a99c-168eee639e51	15849.59	bank	Partial payment received	2025-08-07 19:37:17.348986+00	2025-08-28 19:37:17.410719+00
bff99fdf-e7f6-4a47-a7f5-86ad61efe568	529bd7a8-0f07-4f1e-afba-5338bada7e9d	e7e09c4a-d5a3-4fbd-a283-839b5f39386a	3665.56	card	Partial payment received	2025-06-18 19:37:17.349154+00	2025-08-28 19:37:17.410719+00
43c0a4a7-c4c1-49d0-a919-ce4f0f814708	529bd7a8-0f07-4f1e-afba-5338bada7e9d	c366e68b-8849-45f3-bee9-c7b7575d4f39	6865.24	card	Partial payment received	2025-08-22 19:37:17.350866+00	2025-08-28 19:37:17.410719+00
9dabd97d-0e37-47c0-85c2-bcb78feddfe9	812f3b51-f56b-48f2-901f-2bd296dcf65e	ab05ac11-07b4-4150-9873-0666323c2630	16950.00	cash	Full payment received	2025-08-14 19:37:17.352039+00	2025-08-28 19:37:17.410719+00
\.


--
-- TOC entry 4028 (class 0 OID 20204)
-- Dependencies: 240
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.performance_metrics (id, metric_type, metric_name, value, unit, threshold_value, status, service_name, endpoint, additional_data, recorded_at, created_at) FROM stdin;
\.


--
-- TOC entry 4023 (class 0 OID 20158)
-- Dependencies: 235
-- Data for Name: profitability_analysis; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.profitability_analysis (id, entity_type, entity_id, analysis_period_start, analysis_period_end, total_revenue, total_cost, gross_profit, profit_margin, markup_percentage, units_sold, average_selling_price, average_cost_price, profit_per_unit, additional_metrics, calculated_at, created_at) FROM stdin;
\.


--
-- TOC entry 4055 (class 0 OID 20633)
-- Dependencies: 267
-- Data for Name: report_executions; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.report_executions (id, report_id, execution_type, status, export_format, file_path, file_size, generation_time_seconds, error_message, parameters, task_metadata, created_at, completed_at) FROM stdin;
\.


--
-- TOC entry 4016 (class 0 OID 20073)
-- Dependencies: 228
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.roles (id, name, description, permissions, created_at) FROM stdin;
809d602f-51ca-40ed-8861-c3157e401797	Owner	Full system access with all permissions	{"send_sms": true, "view_roles": true, "manage_roles": true, "manage_users": true, "view_reports": true, "edit_invoices": true, "edit_settings": true, "view_invoices": true, "view_settings": true, "edit_inventory": true, "view_customers": true, "view_dashboard": true, "view_inventory": true, "create_invoices": true, "edit_accounting": true, "manage_payments": true, "view_accounting": true, "manage_customers": true}	2025-08-28 19:37:03.04557+00
d8fd8c89-8d51-45f4-a46b-8e1843391733	Manager	Management access with most permissions	{"send_sms": true, "manage_roles": false, "manage_users": false, "view_reports": true, "edit_invoices": true, "edit_settings": true, "view_invoices": true, "edit_inventory": true, "view_customers": true, "view_dashboard": true, "view_inventory": true, "create_invoices": true, "manage_payments": true, "view_accounting": true, "manage_customers": true}	2025-08-28 19:37:03.04557+00
627762d6-e065-4377-bb59-53b960834b08	Accountant	Financial and accounting access	{"send_sms": false, "manage_roles": false, "manage_users": false, "view_reports": true, "edit_invoices": false, "view_invoices": true, "edit_inventory": false, "view_customers": true, "view_dashboard": true, "view_inventory": true, "create_invoices": false, "edit_accounting": true, "manage_payments": false, "manage_settings": false, "view_accounting": true, "manage_customers": false}	2025-08-28 19:37:03.04557+00
cc05f9c8-eff2-4a4d-87ee-f18badfa6173	Cashier	Sales and customer service access	{"send_sms": true, "manage_roles": false, "manage_users": false, "view_reports": false, "edit_invoices": false, "view_invoices": true, "edit_inventory": false, "view_customers": true, "view_dashboard": true, "view_inventory": true, "create_invoices": true, "edit_accounting": false, "manage_payments": true, "manage_settings": false, "view_accounting": false, "manage_customers": true}	2025-08-28 19:37:03.04557+00
\.


--
-- TOC entry 4043 (class 0 OID 20424)
-- Dependencies: 255
-- Data for Name: scheduled_reports; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.scheduled_reports (id, name, description, report_config, schedule_config, recipients, export_formats, is_active, next_run_at, last_run_at, last_success_at, run_count, error_count, last_error, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4048 (class 0 OID 20506)
-- Dependencies: 260
-- Data for Name: seasonal_analysis; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.seasonal_analysis (id, item_id, category_id, analysis_type, season, year, baseline_demand, seasonal_factor, peak_period_start, peak_period_end, demand_variance, confidence_level, recommendations, created_at) FROM stdin;
\.


--
-- TOC entry 4040 (class 0 OID 20372)
-- Dependencies: 252
-- Data for Name: sms_campaigns; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.sms_campaigns (id, name, template_id, message_content, total_recipients, sent_count, failed_count, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4052 (class 0 OID 20569)
-- Dependencies: 264
-- Data for Name: sms_messages; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.sms_messages (id, campaign_id, customer_id, phone_number, message_content, status, delivery_status, gateway_message_id, error_message, retry_count, max_retries, sent_at, delivered_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4021 (class 0 OID 20138)
-- Dependencies: 233
-- Data for Name: sms_templates; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.sms_templates (id, name, template_type, message_template, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4046 (class 0 OID 20473)
-- Dependencies: 258
-- Data for Name: stock_optimization_recommendations; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.stock_optimization_recommendations (id, item_id, recommendation_type, current_stock, recommended_stock, reorder_point, reorder_quantity, safety_stock, max_stock_level, economic_order_quantity, lead_time_days, holding_cost_per_unit, ordering_cost, stockout_cost, confidence_score, reasoning, priority_level, estimated_savings, implementation_date, status, created_at, expires_at) FROM stdin;
\.


--
-- TOC entry 4032 (class 0 OID 20241)
-- Dependencies: 244
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: goldshop_user
--

COPY public.users (id, username, email, password_hash, role_id, is_active, created_at, updated_at) FROM stdin;
8734e94d-12d4-4d5d-8ef0-8923693e718d	admin	admin@goldshop.com	$2b$12$2hG.baNDwWDuLMbeOYTGKeAuPXNTWyZ/xOA1teKtTcHhPiuU8S7vm	809d602f-51ca-40ed-8861-c3157e401797	t	2025-08-28 19:37:03.04557+00	2025-08-28 19:37:03.04557+00
f61a4493-0d29-415c-ba94-d15269dc7e9c	manager	manager@goldshop.com	$2b$12$1CZtXg13n4Stj/gdb/fxJOuiB6lDD3gj1X8XZsNMahuSVafmL2mzG	d8fd8c89-8d51-45f4-a46b-8e1843391733	t	2025-08-28 19:37:03.04557+00	2025-08-28 19:37:03.04557+00
f005ca88-07ed-4ca9-a3e5-6500fc799c10	accountant	accountant@goldshop.com	$2b$12$5kP2b4jxb9C6n0fCpmfEWOUcJ2rIhke0N5juuq89CMJV8aQ8lHVHe	627762d6-e065-4377-bb59-53b960834b08	t	2025-08-28 19:37:03.04557+00	2025-08-28 19:37:03.04557+00
e2fb388d-7395-4aa5-9e5f-ace79ba941a5	cashier	cashier@goldshop.com	$2b$12$KaqwODibOESyNrrx4bE75e/ynpRgoOodJnzTvobM46lDPqSyqwYRa	cc05f9c8-eff2-4a4d-87ee-f18badfa6173	t	2025-08-28 19:37:03.04557+00	2025-08-28 19:37:03.04557+00
\.


--
-- TOC entry 3650 (class 2606 OID 18883)
-- Name: alert_history alert_history_pkey; Type: CONSTRAINT; Schema: analytics; Owner: goldshop_user
--

ALTER TABLE ONLY analytics.alert_history
    ADD CONSTRAINT alert_history_pkey PRIMARY KEY (id, triggered_at);


--
-- TOC entry 3645 (class 2606 OID 18871)
-- Name: alert_rules alert_rules_pkey; Type: CONSTRAINT; Schema: analytics; Owner: goldshop_user
--

ALTER TABLE ONLY analytics.alert_rules
    ADD CONSTRAINT alert_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 3614 (class 2606 OID 18780)
-- Name: analytics_cache analytics_cache_pkey; Type: CONSTRAINT; Schema: analytics; Owner: goldshop_user
--

ALTER TABLE ONLY analytics.analytics_cache
    ADD CONSTRAINT analytics_cache_pkey PRIMARY KEY (cache_key);


--
-- TOC entry 3641 (class 2606 OID 18857)
-- Name: backup_logs backup_logs_pkey; Type: CONSTRAINT; Schema: analytics; Owner: goldshop_user
--

ALTER TABLE ONLY analytics.backup_logs
    ADD CONSTRAINT backup_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3630 (class 2606 OID 18832)
-- Name: category_performance category_performance_pkey; Type: CONSTRAINT; Schema: analytics; Owner: goldshop_user
--

ALTER TABLE ONLY analytics.category_performance
    ADD CONSTRAINT category_performance_pkey PRIMARY KEY (id, created_at);


--
-- TOC entry 3625 (class 2606 OID 18812)
-- Name: cost_analysis cost_analysis_pkey; Type: CONSTRAINT; Schema: analytics; Owner: goldshop_user
--

ALTER TABLE ONLY analytics.cost_analysis
    ADD CONSTRAINT cost_analysis_pkey PRIMARY KEY (id, created_at);


--
-- TOC entry 3608 (class 2606 OID 18772)
-- Name: custom_reports custom_reports_pkey; Type: CONSTRAINT; Schema: analytics; Owner: goldshop_user
--

ALTER TABLE ONLY analytics.custom_reports
    ADD CONSTRAINT custom_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 3603 (class 2606 OID 18758)
-- Name: demand_forecasts demand_forecasts_pkey; Type: CONSTRAINT; Schema: analytics; Owner: goldshop_user
--

ALTER TABLE ONLY analytics.demand_forecasts
    ADD CONSTRAINT demand_forecasts_pkey PRIMARY KEY (id, created_at);


--
-- TOC entry 3659 (class 2606 OID 18898)
-- Name: image_management image_management_pkey; Type: CONSTRAINT; Schema: analytics; Owner: goldshop_user
--

ALTER TABLE ONLY analytics.image_management
    ADD CONSTRAINT image_management_pkey PRIMARY KEY (id);


--
-- TOC entry 3600 (class 2606 OID 18745)
-- Name: kpi_snapshots kpi_snapshots_pkey; Type: CONSTRAINT; Schema: analytics; Owner: goldshop_user
--

ALTER TABLE ONLY analytics.kpi_snapshots
    ADD CONSTRAINT kpi_snapshots_pkey PRIMARY KEY (id, created_at);


--
-- TOC entry 3638 (class 2606 OID 18844)
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: analytics; Owner: goldshop_user
--

ALTER TABLE ONLY analytics.performance_metrics
    ADD CONSTRAINT performance_metrics_pkey PRIMARY KEY (id, recorded_at);


--
-- TOC entry 3622 (class 2606 OID 18797)
-- Name: stock_optimization_recommendations stock_optimization_recommendations_pkey; Type: CONSTRAINT; Schema: analytics; Owner: goldshop_user
--

ALTER TABLE ONLY analytics.stock_optimization_recommendations
    ADD CONSTRAINT stock_optimization_recommendations_pkey PRIMARY KEY (id);


--
-- TOC entry 3682 (class 2606 OID 20127)
-- Name: accounting_entries accounting_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.accounting_entries
    ADD CONSTRAINT accounting_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 3829 (class 2606 OID 20663)
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- TOC entry 3821 (class 2606 OID 20622)
-- Name: alert_history alert_history_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.alert_history
    ADD CONSTRAINT alert_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3802 (class 2606 OID 20547)
-- Name: alert_rules alert_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.alert_rules
    ADD CONSTRAINT alert_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 3706 (class 2606 OID 20195)
-- Name: analytics_cache analytics_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.analytics_cache
    ADD CONSTRAINT analytics_cache_pkey PRIMARY KEY (cache_key);


--
-- TOC entry 3690 (class 2606 OID 20154)
-- Name: analytics_data analytics_data_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.analytics_data
    ADD CONSTRAINT analytics_data_pkey PRIMARY KEY (id);


--
-- TOC entry 3712 (class 2606 OID 20219)
-- Name: backup_logs backup_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.backup_logs
    ADD CONSTRAINT backup_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3665 (class 2606 OID 20091)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3747 (class 2606 OID 20315)
-- Name: category_performance category_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.category_performance
    ADD CONSTRAINT category_performance_pkey PRIMARY KEY (id);


--
-- TOC entry 3749 (class 2606 OID 20329)
-- Name: category_templates category_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.category_templates
    ADD CONSTRAINT category_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 3686 (class 2606 OID 20137)
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3708 (class 2606 OID 20203)
-- Name: cost_analysis cost_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.cost_analysis
    ADD CONSTRAINT cost_analysis_pkey PRIMARY KEY (id);


--
-- TOC entry 3776 (class 2606 OID 20449)
-- Name: custom_reports custom_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.custom_reports
    ADD CONSTRAINT custom_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 3741 (class 2606 OID 20298)
-- Name: customer_behavior_analysis customer_behavior_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.customer_behavior_analysis
    ADD CONSTRAINT customer_behavior_analysis_pkey PRIMARY KEY (id);


--
-- TOC entry 3815 (class 2606 OID 20597)
-- Name: customer_segment_assignments customer_segment_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.customer_segment_assignments
    ADD CONSTRAINT customer_segment_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 3766 (class 2606 OID 20415)
-- Name: customer_segments customer_segments_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.customer_segments
    ADD CONSTRAINT customer_segments_pkey PRIMARY KEY (id);


--
-- TOC entry 3768 (class 2606 OID 20417)
-- Name: customer_segments customer_segments_segment_name_key; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.customer_segments
    ADD CONSTRAINT customer_segments_segment_name_key UNIQUE (segment_name);


--
-- TOC entry 3670 (class 2606 OID 20110)
-- Name: customers customers_national_id_key; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_national_id_key UNIQUE (national_id);


--
-- TOC entry 3672 (class 2606 OID 20108)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- TOC entry 3792 (class 2606 OID 20498)
-- Name: demand_forecasting demand_forecasting_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.demand_forecasting
    ADD CONSTRAINT demand_forecasting_pkey PRIMARY KEY (id);


--
-- TOC entry 3800 (class 2606 OID 20533)
-- Name: demand_forecasts demand_forecasts_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.demand_forecasts
    ADD CONSTRAINT demand_forecasts_pkey PRIMARY KEY (id);


--
-- TOC entry 3804 (class 2606 OID 20560)
-- Name: forecast_models forecast_models_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.forecast_models
    ADD CONSTRAINT forecast_models_pkey PRIMARY KEY (id);


--
-- TOC entry 3717 (class 2606 OID 20228)
-- Name: image_management image_management_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.image_management
    ADD CONSTRAINT image_management_pkey PRIMARY KEY (id);


--
-- TOC entry 3732 (class 2606 OID 20265)
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3721 (class 2606 OID 20238)
-- Name: inventory_performance_metrics inventory_performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.inventory_performance_metrics
    ADD CONSTRAINT inventory_performance_metrics_pkey PRIMARY KEY (id);


--
-- TOC entry 3784 (class 2606 OID 20464)
-- Name: inventory_turnover_analysis inventory_turnover_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.inventory_turnover_analysis
    ADD CONSTRAINT inventory_turnover_analysis_pkey PRIMARY KEY (id);


--
-- TOC entry 3751 (class 2606 OID 20339)
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3737 (class 2606 OID 20282)
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- TOC entry 3739 (class 2606 OID 20280)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 3704 (class 2606 OID 20187)
-- Name: kpi_snapshots kpi_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.kpi_snapshots
    ADD CONSTRAINT kpi_snapshots_pkey PRIMARY KEY (id);


--
-- TOC entry 3764 (class 2606 OID 20399)
-- Name: kpi_targets kpi_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.kpi_targets
    ADD CONSTRAINT kpi_targets_pkey PRIMARY KEY (id);


--
-- TOC entry 3702 (class 2606 OID 20177)
-- Name: margin_analysis margin_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.margin_analysis
    ADD CONSTRAINT margin_analysis_pkey PRIMARY KEY (id);


--
-- TOC entry 3756 (class 2606 OID 20358)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3710 (class 2606 OID 20211)
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT performance_metrics_pkey PRIMARY KEY (id);


--
-- TOC entry 3698 (class 2606 OID 20166)
-- Name: profitability_analysis profitability_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.profitability_analysis
    ADD CONSTRAINT profitability_analysis_pkey PRIMARY KEY (id);


--
-- TOC entry 3827 (class 2606 OID 20640)
-- Name: report_executions report_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.report_executions
    ADD CONSTRAINT report_executions_pkey PRIMARY KEY (id);


--
-- TOC entry 3661 (class 2606 OID 20082)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 3663 (class 2606 OID 20080)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3774 (class 2606 OID 20432)
-- Name: scheduled_reports scheduled_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.scheduled_reports
    ADD CONSTRAINT scheduled_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 3798 (class 2606 OID 20513)
-- Name: seasonal_analysis seasonal_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.seasonal_analysis
    ADD CONSTRAINT seasonal_analysis_pkey PRIMARY KEY (id);


--
-- TOC entry 3760 (class 2606 OID 20380)
-- Name: sms_campaigns sms_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.sms_campaigns
    ADD CONSTRAINT sms_campaigns_pkey PRIMARY KEY (id);


--
-- TOC entry 3813 (class 2606 OID 20577)
-- Name: sms_messages sms_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.sms_messages
    ADD CONSTRAINT sms_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3688 (class 2606 OID 20146)
-- Name: sms_templates sms_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.sms_templates
    ADD CONSTRAINT sms_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 3790 (class 2606 OID 20480)
-- Name: stock_optimization_recommendations stock_optimization_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.stock_optimization_recommendations
    ADD CONSTRAINT stock_optimization_recommendations_pkey PRIMARY KEY (id);


--
-- TOC entry 3819 (class 2606 OID 20651)
-- Name: customer_segment_assignments unique_customer_segment; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.customer_segment_assignments
    ADD CONSTRAINT unique_customer_segment UNIQUE (customer_id, segment_id);


--
-- TOC entry 3723 (class 2606 OID 20251)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3725 (class 2606 OID 20247)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3727 (class 2606 OID 20249)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 3651 (class 1259 OID 18884)
-- Name: alert_history_triggered_at_idx; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX alert_history_triggered_at_idx ON analytics.alert_history USING btree (triggered_at DESC);


--
-- TOC entry 3628 (class 1259 OID 18833)
-- Name: category_performance_created_at_idx; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX category_performance_created_at_idx ON analytics.category_performance USING btree (created_at DESC);


--
-- TOC entry 3623 (class 1259 OID 18813)
-- Name: cost_analysis_created_at_idx; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX cost_analysis_created_at_idx ON analytics.cost_analysis USING btree (created_at DESC);


--
-- TOC entry 3601 (class 1259 OID 18759)
-- Name: demand_forecasts_created_at_idx; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX demand_forecasts_created_at_idx ON analytics.demand_forecasts USING btree (created_at DESC);


--
-- TOC entry 3652 (class 1259 OID 18930)
-- Name: idx_alert_history_acknowledged; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_alert_history_acknowledged ON analytics.alert_history USING btree (acknowledged) WHERE (acknowledged = false);


--
-- TOC entry 3653 (class 1259 OID 18929)
-- Name: idx_alert_history_level; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_alert_history_level ON analytics.alert_history USING btree (alert_level);


--
-- TOC entry 3654 (class 1259 OID 18928)
-- Name: idx_alert_history_rule_triggered; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_alert_history_rule_triggered ON analytics.alert_history USING btree (rule_id, triggered_at DESC);


--
-- TOC entry 3646 (class 1259 OID 18925)
-- Name: idx_alert_rules_active; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_alert_rules_active ON analytics.alert_rules USING btree (is_active) WHERE (is_active = true);


--
-- TOC entry 3647 (class 1259 OID 18927)
-- Name: idx_alert_rules_created_by; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_alert_rules_created_by ON analytics.alert_rules USING btree (created_by);


--
-- TOC entry 3648 (class 1259 OID 18926)
-- Name: idx_alert_rules_type; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_alert_rules_type ON analytics.alert_rules USING btree (rule_type);


--
-- TOC entry 3615 (class 1259 OID 18909)
-- Name: idx_analytics_cache_expires; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_analytics_cache_expires ON analytics.analytics_cache USING btree (expires_at);


--
-- TOC entry 3616 (class 1259 OID 18910)
-- Name: idx_analytics_cache_type_entity; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_analytics_cache_type_entity ON analytics.analytics_cache USING btree (cache_type, entity_type, entity_id);


--
-- TOC entry 3642 (class 1259 OID 18924)
-- Name: idx_backup_logs_status; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_backup_logs_status ON analytics.backup_logs USING btree (backup_status);


--
-- TOC entry 3643 (class 1259 OID 18923)
-- Name: idx_backup_logs_type_started; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_backup_logs_type_started ON analytics.backup_logs USING btree (backup_type, started_at DESC);


--
-- TOC entry 3631 (class 1259 OID 18917)
-- Name: idx_category_performance_category_date; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_category_performance_category_date ON analytics.category_performance USING btree (category_id, analysis_date);


--
-- TOC entry 3632 (class 1259 OID 18918)
-- Name: idx_category_performance_classification; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_category_performance_classification ON analytics.category_performance USING btree (movement_classification);


--
-- TOC entry 3633 (class 1259 OID 18919)
-- Name: idx_category_performance_velocity; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_category_performance_velocity ON analytics.category_performance USING btree (velocity_score);


--
-- TOC entry 3626 (class 1259 OID 18915)
-- Name: idx_cost_analysis_entity_date; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_cost_analysis_entity_date ON analytics.cost_analysis USING btree (entity_type, entity_id, analysis_date);


--
-- TOC entry 3627 (class 1259 OID 18916)
-- Name: idx_cost_analysis_total_cost; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_cost_analysis_total_cost ON analytics.cost_analysis USING btree (total_cost);


--
-- TOC entry 3609 (class 1259 OID 18905)
-- Name: idx_custom_reports_created_by; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_custom_reports_created_by ON analytics.custom_reports USING btree (created_by);


--
-- TOC entry 3610 (class 1259 OID 18908)
-- Name: idx_custom_reports_public; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_custom_reports_public ON analytics.custom_reports USING btree (is_public) WHERE (is_public = true);


--
-- TOC entry 3611 (class 1259 OID 18907)
-- Name: idx_custom_reports_scheduled; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_custom_reports_scheduled ON analytics.custom_reports USING btree (is_scheduled) WHERE (is_scheduled = true);


--
-- TOC entry 3612 (class 1259 OID 18906)
-- Name: idx_custom_reports_type; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_custom_reports_type ON analytics.custom_reports USING btree (report_type);


--
-- TOC entry 3604 (class 1259 OID 18904)
-- Name: idx_demand_forecasts_accuracy; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_demand_forecasts_accuracy ON analytics.demand_forecasts USING btree (accuracy_score) WHERE (accuracy_score IS NOT NULL);


--
-- TOC entry 3605 (class 1259 OID 18902)
-- Name: idx_demand_forecasts_item_date; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_demand_forecasts_item_date ON analytics.demand_forecasts USING btree (item_id, forecast_date);


--
-- TOC entry 3606 (class 1259 OID 18903)
-- Name: idx_demand_forecasts_period_created; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_demand_forecasts_period_created ON analytics.demand_forecasts USING btree (forecast_period, created_at DESC);


--
-- TOC entry 3655 (class 1259 OID 18931)
-- Name: idx_image_management_entity; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_image_management_entity ON analytics.image_management USING btree (entity_type, entity_id);


--
-- TOC entry 3656 (class 1259 OID 18932)
-- Name: idx_image_management_primary; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_image_management_primary ON analytics.image_management USING btree (entity_type, entity_id, is_primary) WHERE (is_primary = true);


--
-- TOC entry 3657 (class 1259 OID 18933)
-- Name: idx_image_management_sort; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_image_management_sort ON analytics.image_management USING btree (entity_type, entity_id, sort_order);


--
-- TOC entry 3595 (class 1259 OID 18901)
-- Name: idx_kpi_snapshots_achievement; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_kpi_snapshots_achievement ON analytics.kpi_snapshots USING btree (achievement_rate) WHERE (achievement_rate IS NOT NULL);


--
-- TOC entry 3596 (class 1259 OID 18900)
-- Name: idx_kpi_snapshots_name_created; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_kpi_snapshots_name_created ON analytics.kpi_snapshots USING btree (kpi_name, created_at DESC);


--
-- TOC entry 3597 (class 1259 OID 18899)
-- Name: idx_kpi_snapshots_type_period; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_kpi_snapshots_type_period ON analytics.kpi_snapshots USING btree (kpi_type, period_start, period_end);


--
-- TOC entry 3634 (class 1259 OID 18922)
-- Name: idx_performance_metrics_endpoint; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_performance_metrics_endpoint ON analytics.performance_metrics USING btree (endpoint) WHERE (endpoint IS NOT NULL);


--
-- TOC entry 3635 (class 1259 OID 18921)
-- Name: idx_performance_metrics_service_status; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_performance_metrics_service_status ON analytics.performance_metrics USING btree (service_name, status);


--
-- TOC entry 3636 (class 1259 OID 18920)
-- Name: idx_performance_metrics_type_recorded; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_performance_metrics_type_recorded ON analytics.performance_metrics USING btree (metric_type, recorded_at DESC);


--
-- TOC entry 3617 (class 1259 OID 18911)
-- Name: idx_stock_optimization_item; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_stock_optimization_item ON analytics.stock_optimization_recommendations USING btree (item_id);


--
-- TOC entry 3618 (class 1259 OID 18913)
-- Name: idx_stock_optimization_priority; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_stock_optimization_priority ON analytics.stock_optimization_recommendations USING btree (priority_level);


--
-- TOC entry 3619 (class 1259 OID 18914)
-- Name: idx_stock_optimization_status; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_stock_optimization_status ON analytics.stock_optimization_recommendations USING btree (status);


--
-- TOC entry 3620 (class 1259 OID 18912)
-- Name: idx_stock_optimization_type; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX idx_stock_optimization_type ON analytics.stock_optimization_recommendations USING btree (recommendation_type);


--
-- TOC entry 3598 (class 1259 OID 18746)
-- Name: kpi_snapshots_created_at_idx; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX kpi_snapshots_created_at_idx ON analytics.kpi_snapshots USING btree (created_at DESC);


--
-- TOC entry 3639 (class 1259 OID 18845)
-- Name: performance_metrics_recorded_at_idx; Type: INDEX; Schema: analytics; Owner: goldshop_user
--

CREATE INDEX performance_metrics_recorded_at_idx ON analytics.performance_metrics USING btree (recorded_at DESC);


--
-- TOC entry 3683 (class 1259 OID 20128)
-- Name: idx_accounting_entries_reference; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_accounting_entries_reference ON public.accounting_entries USING btree (reference_id, reference_type);


--
-- TOC entry 3684 (class 1259 OID 20129)
-- Name: idx_accounting_entries_type_date; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_accounting_entries_type_date ON public.accounting_entries USING btree (entry_type, transaction_date);


--
-- TOC entry 3691 (class 1259 OID 20156)
-- Name: idx_analytics_data_entity; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_analytics_data_entity ON public.analytics_data USING btree (entity_type, entity_id);


--
-- TOC entry 3692 (class 1259 OID 20157)
-- Name: idx_analytics_data_metric; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_analytics_data_metric ON public.analytics_data USING btree (metric_name, calculation_date);


--
-- TOC entry 3693 (class 1259 OID 20155)
-- Name: idx_analytics_data_type_date; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_analytics_data_type_date ON public.analytics_data USING btree (data_type, calculation_date);


--
-- TOC entry 3666 (class 1259 OID 20099)
-- Name: idx_categories_active; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_categories_active ON public.categories USING btree (is_active);


--
-- TOC entry 3667 (class 1259 OID 20098)
-- Name: idx_categories_parent; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_categories_parent ON public.categories USING btree (parent_id);


--
-- TOC entry 3668 (class 1259 OID 20097)
-- Name: idx_categories_sort; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_categories_sort ON public.categories USING btree (sort_order);


--
-- TOC entry 3777 (class 1259 OID 20455)
-- Name: idx_custom_reports_created_by; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_custom_reports_created_by ON public.custom_reports USING btree (created_by);


--
-- TOC entry 3778 (class 1259 OID 20457)
-- Name: idx_custom_reports_public; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_custom_reports_public ON public.custom_reports USING btree (is_public);


--
-- TOC entry 3779 (class 1259 OID 20456)
-- Name: idx_custom_reports_template; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_custom_reports_template ON public.custom_reports USING btree (is_template);


--
-- TOC entry 3742 (class 1259 OID 20307)
-- Name: idx_customer_behavior_churn; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customer_behavior_churn ON public.customer_behavior_analysis USING btree (churn_probability);


--
-- TOC entry 3743 (class 1259 OID 20306)
-- Name: idx_customer_behavior_customer; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customer_behavior_customer ON public.customer_behavior_analysis USING btree (customer_id);


--
-- TOC entry 3744 (class 1259 OID 20304)
-- Name: idx_customer_behavior_ltv; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customer_behavior_ltv ON public.customer_behavior_analysis USING btree (customer_lifetime_value);


--
-- TOC entry 3745 (class 1259 OID 20305)
-- Name: idx_customer_behavior_period; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customer_behavior_period ON public.customer_behavior_analysis USING btree (analysis_period_start, analysis_period_end);


--
-- TOC entry 3816 (class 1259 OID 20608)
-- Name: idx_customer_segment_assignments_customer; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customer_segment_assignments_customer ON public.customer_segment_assignments USING btree (customer_id);


--
-- TOC entry 3817 (class 1259 OID 20609)
-- Name: idx_customer_segment_assignments_segment; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customer_segment_assignments_segment ON public.customer_segment_assignments USING btree (segment_id);


--
-- TOC entry 3769 (class 1259 OID 20423)
-- Name: idx_customer_segments_active; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customer_segments_active ON public.customer_segments USING btree (is_active);


--
-- TOC entry 3673 (class 1259 OID 20117)
-- Name: idx_customers_active; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customers_active ON public.customers USING btree (is_active);


--
-- TOC entry 3674 (class 1259 OID 20113)
-- Name: idx_customers_city; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customers_city ON public.customers USING btree (city);


--
-- TOC entry 3675 (class 1259 OID 20114)
-- Name: idx_customers_debt; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customers_debt ON public.customers USING btree (current_debt);


--
-- TOC entry 3676 (class 1259 OID 20112)
-- Name: idx_customers_dob; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customers_dob ON public.customers USING btree (date_of_birth);


--
-- TOC entry 3677 (class 1259 OID 20118)
-- Name: idx_customers_email; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customers_email ON public.customers USING btree (email);


--
-- TOC entry 3678 (class 1259 OID 20111)
-- Name: idx_customers_national_id; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customers_national_id ON public.customers USING btree (national_id);


--
-- TOC entry 3679 (class 1259 OID 20116)
-- Name: idx_customers_phone; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);


--
-- TOC entry 3680 (class 1259 OID 20115)
-- Name: idx_customers_type; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_customers_type ON public.customers USING btree (customer_type);


--
-- TOC entry 3793 (class 1259 OID 20505)
-- Name: idx_demand_forecasting_item_period; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_demand_forecasting_item_period ON public.demand_forecasting USING btree (item_id, forecast_period_start, forecast_period_end);


--
-- TOC entry 3794 (class 1259 OID 20504)
-- Name: idx_demand_forecasting_type; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_demand_forecasting_type ON public.demand_forecasting USING btree (forecast_type);


--
-- TOC entry 3805 (class 1259 OID 20566)
-- Name: idx_forecast_models_active; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_forecast_models_active ON public.forecast_models USING btree (is_active);


--
-- TOC entry 3806 (class 1259 OID 20567)
-- Name: idx_forecast_models_confidence; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_forecast_models_confidence ON public.forecast_models USING btree (confidence_score);


--
-- TOC entry 3807 (class 1259 OID 20568)
-- Name: idx_forecast_models_item; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_forecast_models_item ON public.forecast_models USING btree (item_id);


--
-- TOC entry 3713 (class 1259 OID 20229)
-- Name: idx_image_management_entity; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_image_management_entity ON public.image_management USING btree (entity_type, entity_id);


--
-- TOC entry 3714 (class 1259 OID 20230)
-- Name: idx_image_management_primary; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_image_management_primary ON public.image_management USING btree (is_primary);


--
-- TOC entry 3715 (class 1259 OID 20231)
-- Name: idx_image_management_sort; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_image_management_sort ON public.image_management USING btree (sort_order);


--
-- TOC entry 3728 (class 1259 OID 20272)
-- Name: idx_inventory_items_active; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_inventory_items_active ON public.inventory_items USING btree (is_active);


--
-- TOC entry 3729 (class 1259 OID 20271)
-- Name: idx_inventory_items_category; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_inventory_items_category ON public.inventory_items USING btree (category_id);


--
-- TOC entry 3730 (class 1259 OID 20273)
-- Name: idx_inventory_items_stock; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_inventory_items_stock ON public.inventory_items USING btree (stock_quantity);


--
-- TOC entry 3718 (class 1259 OID 20240)
-- Name: idx_inventory_performance_date; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_inventory_performance_date ON public.inventory_performance_metrics USING btree (metric_date);


--
-- TOC entry 3719 (class 1259 OID 20239)
-- Name: idx_inventory_performance_score; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_inventory_performance_score ON public.inventory_performance_metrics USING btree (optimization_score);


--
-- TOC entry 3780 (class 1259 OID 20470)
-- Name: idx_inventory_turnover_classification; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_inventory_turnover_classification ON public.inventory_turnover_analysis USING btree (movement_classification);


--
-- TOC entry 3781 (class 1259 OID 20471)
-- Name: idx_inventory_turnover_item_period; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_inventory_turnover_item_period ON public.inventory_turnover_analysis USING btree (item_id, analysis_period_start, analysis_period_end);


--
-- TOC entry 3782 (class 1259 OID 20472)
-- Name: idx_inventory_turnover_velocity; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_inventory_turnover_velocity ON public.inventory_turnover_analysis USING btree (velocity_score);


--
-- TOC entry 3733 (class 1259 OID 20290)
-- Name: idx_invoices_customer; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_invoices_customer ON public.invoices USING btree (customer_id);


--
-- TOC entry 3734 (class 1259 OID 20289)
-- Name: idx_invoices_date; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_invoices_date ON public.invoices USING btree (created_at);


--
-- TOC entry 3735 (class 1259 OID 20288)
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- TOC entry 3761 (class 1259 OID 20406)
-- Name: idx_kpi_targets_active; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_kpi_targets_active ON public.kpi_targets USING btree (is_active, period_start, period_end);


--
-- TOC entry 3762 (class 1259 OID 20405)
-- Name: idx_kpi_targets_type_period; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_kpi_targets_type_period ON public.kpi_targets USING btree (kpi_type, target_period);


--
-- TOC entry 3699 (class 1259 OID 20178)
-- Name: idx_margin_analysis_entity_date; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_margin_analysis_entity_date ON public.margin_analysis USING btree (entity_type, entity_id, analysis_date);


--
-- TOC entry 3700 (class 1259 OID 20179)
-- Name: idx_margin_analysis_variance; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_margin_analysis_variance ON public.margin_analysis USING btree (margin_variance);


--
-- TOC entry 3752 (class 1259 OID 20370)
-- Name: idx_payments_customer; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_payments_customer ON public.payments USING btree (customer_id);


--
-- TOC entry 3753 (class 1259 OID 20371)
-- Name: idx_payments_date; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_payments_date ON public.payments USING btree (payment_date);


--
-- TOC entry 3754 (class 1259 OID 20369)
-- Name: idx_payments_invoice; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_payments_invoice ON public.payments USING btree (invoice_id);


--
-- TOC entry 3694 (class 1259 OID 20167)
-- Name: idx_profitability_analysis_entity; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_profitability_analysis_entity ON public.profitability_analysis USING btree (entity_type, entity_id);


--
-- TOC entry 3695 (class 1259 OID 20168)
-- Name: idx_profitability_analysis_margin; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_profitability_analysis_margin ON public.profitability_analysis USING btree (profit_margin);


--
-- TOC entry 3696 (class 1259 OID 20169)
-- Name: idx_profitability_analysis_period; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_profitability_analysis_period ON public.profitability_analysis USING btree (analysis_period_start, analysis_period_end);


--
-- TOC entry 3822 (class 1259 OID 20648)
-- Name: idx_report_executions_created; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_report_executions_created ON public.report_executions USING btree (created_at);


--
-- TOC entry 3823 (class 1259 OID 20649)
-- Name: idx_report_executions_report; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_report_executions_report ON public.report_executions USING btree (report_id);


--
-- TOC entry 3824 (class 1259 OID 20646)
-- Name: idx_report_executions_status; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_report_executions_status ON public.report_executions USING btree (status);


--
-- TOC entry 3825 (class 1259 OID 20647)
-- Name: idx_report_executions_type; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_report_executions_type ON public.report_executions USING btree (execution_type);


--
-- TOC entry 3770 (class 1259 OID 20438)
-- Name: idx_scheduled_reports_active; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_scheduled_reports_active ON public.scheduled_reports USING btree (is_active);


--
-- TOC entry 3771 (class 1259 OID 20440)
-- Name: idx_scheduled_reports_created_by; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_scheduled_reports_created_by ON public.scheduled_reports USING btree (created_by);


--
-- TOC entry 3772 (class 1259 OID 20439)
-- Name: idx_scheduled_reports_next_run; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_scheduled_reports_next_run ON public.scheduled_reports USING btree (next_run_at);


--
-- TOC entry 3795 (class 1259 OID 20524)
-- Name: idx_seasonal_analysis_category_season; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_seasonal_analysis_category_season ON public.seasonal_analysis USING btree (category_id, season, year);


--
-- TOC entry 3796 (class 1259 OID 20525)
-- Name: idx_seasonal_analysis_item_season; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_seasonal_analysis_item_season ON public.seasonal_analysis USING btree (item_id, season, year);


--
-- TOC entry 3757 (class 1259 OID 20391)
-- Name: idx_sms_campaigns_created_by; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_sms_campaigns_created_by ON public.sms_campaigns USING btree (created_by);


--
-- TOC entry 3758 (class 1259 OID 20392)
-- Name: idx_sms_campaigns_status; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_sms_campaigns_status ON public.sms_campaigns USING btree (status);


--
-- TOC entry 3808 (class 1259 OID 20588)
-- Name: idx_sms_messages_campaign; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_sms_messages_campaign ON public.sms_messages USING btree (campaign_id);


--
-- TOC entry 3809 (class 1259 OID 20590)
-- Name: idx_sms_messages_customer; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_sms_messages_customer ON public.sms_messages USING btree (customer_id);


--
-- TOC entry 3810 (class 1259 OID 20591)
-- Name: idx_sms_messages_phone; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_sms_messages_phone ON public.sms_messages USING btree (phone_number);


--
-- TOC entry 3811 (class 1259 OID 20589)
-- Name: idx_sms_messages_status; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_sms_messages_status ON public.sms_messages USING btree (status);


--
-- TOC entry 3785 (class 1259 OID 20487)
-- Name: idx_stock_optimization_item; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_stock_optimization_item ON public.stock_optimization_recommendations USING btree (item_id);


--
-- TOC entry 3786 (class 1259 OID 20488)
-- Name: idx_stock_optimization_priority; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_stock_optimization_priority ON public.stock_optimization_recommendations USING btree (priority_level);


--
-- TOC entry 3787 (class 1259 OID 20489)
-- Name: idx_stock_optimization_status; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_stock_optimization_status ON public.stock_optimization_recommendations USING btree (status);


--
-- TOC entry 3788 (class 1259 OID 20486)
-- Name: idx_stock_optimization_type; Type: INDEX; Schema: public; Owner: goldshop_user
--

CREATE INDEX idx_stock_optimization_type ON public.stock_optimization_recommendations USING btree (recommendation_type);


--
-- TOC entry 3859 (class 2606 OID 20628)
-- Name: alert_history alert_history_acknowledged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.alert_history
    ADD CONSTRAINT alert_history_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES public.users(id);


--
-- TOC entry 3860 (class 2606 OID 20623)
-- Name: alert_history alert_history_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.alert_history
    ADD CONSTRAINT alert_history_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.alert_rules(id) ON DELETE CASCADE;


--
-- TOC entry 3853 (class 2606 OID 20548)
-- Name: alert_rules alert_rules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.alert_rules
    ADD CONSTRAINT alert_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3830 (class 2606 OID 20092)
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id);


--
-- TOC entry 3835 (class 2606 OID 20316)
-- Name: category_performance category_performance_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.category_performance
    ADD CONSTRAINT category_performance_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- TOC entry 3836 (class 2606 OID 20330)
-- Name: category_templates category_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.category_templates
    ADD CONSTRAINT category_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3846 (class 2606 OID 20450)
-- Name: custom_reports custom_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.custom_reports
    ADD CONSTRAINT custom_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3834 (class 2606 OID 20299)
-- Name: customer_behavior_analysis customer_behavior_analysis_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.customer_behavior_analysis
    ADD CONSTRAINT customer_behavior_analysis_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- TOC entry 3857 (class 2606 OID 20598)
-- Name: customer_segment_assignments customer_segment_assignments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.customer_segment_assignments
    ADD CONSTRAINT customer_segment_assignments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- TOC entry 3858 (class 2606 OID 20603)
-- Name: customer_segment_assignments customer_segment_assignments_segment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.customer_segment_assignments
    ADD CONSTRAINT customer_segment_assignments_segment_id_fkey FOREIGN KEY (segment_id) REFERENCES public.customer_segments(id) ON DELETE CASCADE;


--
-- TOC entry 3844 (class 2606 OID 20418)
-- Name: customer_segments customer_segments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.customer_segments
    ADD CONSTRAINT customer_segments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3849 (class 2606 OID 20499)
-- Name: demand_forecasting demand_forecasting_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.demand_forecasting
    ADD CONSTRAINT demand_forecasting_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- TOC entry 3852 (class 2606 OID 20534)
-- Name: demand_forecasts demand_forecasts_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.demand_forecasts
    ADD CONSTRAINT demand_forecasts_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- TOC entry 3854 (class 2606 OID 20561)
-- Name: forecast_models forecast_models_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.forecast_models
    ADD CONSTRAINT forecast_models_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- TOC entry 3832 (class 2606 OID 20266)
-- Name: inventory_items inventory_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 3847 (class 2606 OID 20465)
-- Name: inventory_turnover_analysis inventory_turnover_analysis_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.inventory_turnover_analysis
    ADD CONSTRAINT inventory_turnover_analysis_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- TOC entry 3837 (class 2606 OID 20345)
-- Name: invoice_items invoice_items_inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id);


--
-- TOC entry 3838 (class 2606 OID 20340)
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- TOC entry 3833 (class 2606 OID 20283)
-- Name: invoices invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- TOC entry 3843 (class 2606 OID 20400)
-- Name: kpi_targets kpi_targets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.kpi_targets
    ADD CONSTRAINT kpi_targets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3839 (class 2606 OID 20359)
-- Name: payments payments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- TOC entry 3840 (class 2606 OID 20364)
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- TOC entry 3861 (class 2606 OID 20641)
-- Name: report_executions report_executions_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.report_executions
    ADD CONSTRAINT report_executions_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.custom_reports(id);


--
-- TOC entry 3845 (class 2606 OID 20433)
-- Name: scheduled_reports scheduled_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.scheduled_reports
    ADD CONSTRAINT scheduled_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3850 (class 2606 OID 20519)
-- Name: seasonal_analysis seasonal_analysis_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.seasonal_analysis
    ADD CONSTRAINT seasonal_analysis_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 3851 (class 2606 OID 20514)
-- Name: seasonal_analysis seasonal_analysis_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.seasonal_analysis
    ADD CONSTRAINT seasonal_analysis_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- TOC entry 3841 (class 2606 OID 20386)
-- Name: sms_campaigns sms_campaigns_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.sms_campaigns
    ADD CONSTRAINT sms_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3842 (class 2606 OID 20381)
-- Name: sms_campaigns sms_campaigns_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.sms_campaigns
    ADD CONSTRAINT sms_campaigns_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.sms_templates(id);


--
-- TOC entry 3855 (class 2606 OID 20578)
-- Name: sms_messages sms_messages_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.sms_messages
    ADD CONSTRAINT sms_messages_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.sms_campaigns(id);


--
-- TOC entry 3856 (class 2606 OID 20583)
-- Name: sms_messages sms_messages_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.sms_messages
    ADD CONSTRAINT sms_messages_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- TOC entry 3848 (class 2606 OID 20481)
-- Name: stock_optimization_recommendations stock_optimization_recommendations_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.stock_optimization_recommendations
    ADD CONSTRAINT stock_optimization_recommendations_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- TOC entry 3831 (class 2606 OID 20252)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: goldshop_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4064 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: goldshop_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2025-08-28 20:19:43 UTC

--
-- PostgreSQL database dump complete
--

