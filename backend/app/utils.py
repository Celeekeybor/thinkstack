from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from .db import db
from .routes.auth import auth_bp
from .routes.submission import submission_bp
from .routes.admin import admin_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')
    
    db.init_app(app)
    JWTManager(app)
    Migrate(app, db)
    
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(submission_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    
    return app