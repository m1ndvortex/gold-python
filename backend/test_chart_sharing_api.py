import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import json
from main import app
from routers.chart_sharing import shared_charts, chart_annotations

client = TestClient(app)

class TestChartSharingAPI:
    """Test chart sharing and collaboration API endpoints."""
    
    def setup_method(self):
        """Clear test data before each test."""
        shared_charts.clear()
        chart_annotations.clear()
    
    def test_create_shared_chart(self):
        """Test creating a shareable chart link."""
        chart_config = {
            "type": "line",
            "data": [
                {"name": "Jan", "value": 100},
                {"name": "Feb", "value": 150},
                {"name": "Mar", "value": 120}
            ],
            "title": "Test Chart",
            "description": "A test chart for sharing"
        }
        
        share_options = {
            "title": "My Shared Chart",
            "description": "This is a test shared chart",
            "tags": ["test", "analytics"],
            "is_public": True,
            "allow_comments": True
        }
        
        response = client.post(
            "/api/chart-sharing/share",
            json={
                "config": chart_config,
                "options": share_options
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "share_id" in data
        assert "share_url" in data
        assert data["share_url"].startswith("/shared/chart/")
        
        # Verify chart was stored
        share_id = data["share_id"]
        assert share_id in shared_charts
        
        stored_chart = shared_charts[share_id]
        assert stored_chart.config.title == "Test Chart"
        assert stored_chart.metadata.title == "My Shared Chart"
        assert "test" in stored_chart.metadata.tags
    
    def test_get_shared_chart(self):
        """Test retrieving a shared chart."""
        # First create a shared chart
        chart_config = {
            "type": "bar",
            "data": [{"name": "A", "value": 10}, {"name": "B", "value": 20}],
            "title": "Bar Chart"
        }
        
        create_response = client.post(
            "/api/chart-sharing/share",
            json={
                "config": chart_config,
                "options": {"title": "Shared Bar Chart"}
            }
        )
        
        share_id = create_response.json()["share_id"]
        
        # Now retrieve it
        response = client.get(f"/api/chart-sharing/shared/{share_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == share_id
        assert data["config"]["title"] == "Bar Chart"
        assert data["metadata"]["title"] == "Shared Bar Chart"
        assert data["view_count"] == 1  # Should increment on view
        assert "created_at" in data
        assert "last_viewed" in data
    
    def test_get_nonexistent_shared_chart(self):
        """Test retrieving a non-existent shared chart."""
        response = client.get("/api/chart-sharing/shared/nonexistent-id")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_get_embed_chart(self):
        """Test getting chart data for embedding."""
        # Create a shared chart
        chart_config = {
            "type": "pie",
            "data": [{"name": "A", "value": 30}, {"name": "B", "value": 70}],
            "title": "Pie Chart"
        }
        
        create_response = client.post(
            "/api/chart-sharing/share",
            json={
                "config": chart_config,
                "options": {"title": "Embedded Pie Chart"}
            }
        )
        
        share_id = create_response.json()["share_id"]
        
        # Get embed data with custom options
        response = client.get(
            f"/api/chart-sharing/embed/{share_id}",
            params={
                "width": 1000,
                "height": 700,
                "theme": "dark",
                "interactive": False,
                "controls": False
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "config" in data
        assert "metadata" in data
        assert "embed_options" in data
        
        embed_options = data["embed_options"]
        assert embed_options["width"] == 1000
        assert embed_options["height"] == 700
        assert embed_options["theme"] == "dark"
        assert embed_options["interactive"] is False
        assert embed_options["show_controls"] is False
    
    def test_delete_shared_chart(self):
        """Test deleting a shared chart."""
        # Create a shared chart
        create_response = client.post(
            "/api/chart-sharing/share",
            json={
                "config": {"type": "line", "data": [], "title": "Test"},
                "options": {"title": "To Delete"}
            }
        )
        
        share_id = create_response.json()["share_id"]
        
        # Verify it exists
        assert share_id in shared_charts
        
        # Delete it
        response = client.delete(f"/api/chart-sharing/shared/{share_id}")
        
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]
        
        # Verify it's gone
        assert share_id not in shared_charts
    
    def test_get_user_shared_charts(self):
        """Test getting all charts shared by current user."""
        # Create multiple shared charts
        for i in range(3):
            client.post(
                "/api/chart-sharing/share",
                json={
                    "config": {"type": "line", "data": [], "title": f"Chart {i}"},
                    "options": {"title": f"Shared Chart {i}"}
                }
            )
        
        response = client.get("/api/chart-sharing/my-shares")
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 3
        assert all("id" in chart for chart in data)
        assert all("config" in chart for chart in data)
        assert all("metadata" in chart for chart in data)
    
    def test_create_annotation(self):
        """Test creating a chart annotation."""
        annotation_data = {
            "x": 100.5,
            "y": 200.3,
            "text": "This is a test annotation",
            "type": "note",
            "color": "#ff0000"
        }
        
        response = client.post(
            "/api/chart-sharing/annotations/test-chart",
            json=annotation_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["chart_id"] == "test-chart"
        assert data["x"] == 100.5
        assert data["y"] == 200.3
        assert data["text"] == "This is a test annotation"
        assert data["type"] == "note"
        assert data["color"] == "#ff0000"
        assert data["author"] == "demo_user"
        assert "created_at" in data
        
        # Verify annotation was stored
        assert "test-chart" in chart_annotations
        assert len(chart_annotations["test-chart"]) == 1
    
    def test_get_chart_annotations(self):
        """Test retrieving all annotations for a chart."""
        chart_id = "test-chart-annotations"
        
        # Create multiple annotations
        for i in range(3):
            client.post(
                f"/api/chart-sharing/annotations/{chart_id}",
                json={
                    "x": i * 10,
                    "y": i * 20,
                    "text": f"Annotation {i}",
                    "type": "note"
                }
            )
        
        response = client.get(f"/api/chart-sharing/annotations/{chart_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 3
        assert all("id" in ann for ann in data)
        assert all(ann["chart_id"] == chart_id for ann in data)
        assert data[0]["text"] == "Annotation 0"
        assert data[1]["text"] == "Annotation 1"
        assert data[2]["text"] == "Annotation 2"
    
    def test_update_annotation(self):
        """Test updating an annotation."""
        chart_id = "test-chart-update"
        
        # Create annotation
        create_response = client.post(
            f"/api/chart-sharing/annotations/{chart_id}",
            json={
                "x": 50,
                "y": 100,
                "text": "Original text",
                "type": "note"
            }
        )
        
        annotation_id = create_response.json()["id"]
        
        # Update annotation
        update_data = {
            "text": "Updated text",
            "type": "highlight",
            "is_pinned": True
        }
        
        response = client.put(
            f"/api/chart-sharing/annotations/{chart_id}/{annotation_id}",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["text"] == "Updated text"
        assert data["type"] == "highlight"
        assert data["is_pinned"] is True
        assert "updated_at" in data
    
    def test_delete_annotation(self):
        """Test deleting an annotation."""
        chart_id = "test-chart-delete"
        
        # Create annotation
        create_response = client.post(
            f"/api/chart-sharing/annotations/{chart_id}",
            json={
                "x": 25,
                "y": 75,
                "text": "To be deleted",
                "type": "note"
            }
        )
        
        annotation_id = create_response.json()["id"]
        
        # Verify it exists
        assert len(chart_annotations[chart_id]) == 1
        
        # Delete annotation
        response = client.delete(
            f"/api/chart-sharing/annotations/{chart_id}/{annotation_id}"
        )
        
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]
        
        # Verify it's gone
        assert len(chart_annotations[chart_id]) == 0
    
    def test_add_annotation_reply(self):
        """Test adding a reply to an annotation."""
        chart_id = "test-chart-reply"
        
        # Create annotation
        create_response = client.post(
            f"/api/chart-sharing/annotations/{chart_id}",
            json={
                "x": 30,
                "y": 60,
                "text": "Original annotation",
                "type": "question"
            }
        )
        
        annotation_id = create_response.json()["id"]
        
        # Add reply
        reply_data = {"text": "This is a reply"}
        
        response = client.post(
            f"/api/chart-sharing/annotations/{chart_id}/{annotation_id}/replies",
            json=reply_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["replies"]) == 1
        reply = data["replies"][0]
        assert reply["text"] == "This is a reply"
        assert reply["author"] == "demo_user"
        assert "id" in reply
        assert "created_at" in reply
    
    def test_get_sharing_stats(self):
        """Test getting sharing analytics."""
        # Create some shared charts with views
        for i in range(3):
            create_response = client.post(
                "/api/chart-sharing/share",
                json={
                    "config": {"type": "line", "data": [], "title": f"Chart {i}"},
                    "options": {"title": f"Stats Chart {i}"}
                }
            )
            
            share_id = create_response.json()["share_id"]
            
            # Simulate some views
            for _ in range(i + 1):
                client.get(f"/api/chart-sharing/shared/{share_id}")
        
        response = client.get("/api/chart-sharing/analytics/sharing-stats")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_shares"] == 3
        assert data["total_views"] == 6  # 1 + 2 + 3 views
        assert "views_last_7_days" in data
        assert "views_last_30_days" in data
        assert "top_charts" in data
        assert len(data["top_charts"]) <= 5
    
    def test_get_annotation_stats(self):
        """Test getting annotation statistics for a chart."""
        chart_id = "test-chart-stats"
        
        # Create annotations of different types
        annotations_data = [
            {"x": 10, "y": 20, "text": "Note 1", "type": "note"},
            {"x": 30, "y": 40, "text": "Question 1", "type": "question"},
            {"x": 50, "y": 60, "text": "Highlight 1", "type": "highlight"},
            {"x": 70, "y": 80, "text": "Note 2", "type": "note"}
        ]
        
        annotation_ids = []
        for ann_data in annotations_data:
            response = client.post(
                f"/api/chart-sharing/annotations/{chart_id}",
                json=ann_data
            )
            annotation_ids.append(response.json()["id"])
        
        # Add some replies
        client.post(
            f"/api/chart-sharing/annotations/{chart_id}/{annotation_ids[0]}/replies",
            json={"text": "Reply 1"}
        )
        client.post(
            f"/api/chart-sharing/annotations/{chart_id}/{annotation_ids[1]}/replies",
            json={"text": "Reply 2"}
        )
        
        # Mark one as resolved
        client.put(
            f"/api/chart-sharing/annotations/{chart_id}/{annotation_ids[1]}",
            json={"is_resolved": True}
        )
        
        response = client.get(f"/api/chart-sharing/analytics/annotation-stats/{chart_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_annotations"] == 4
        assert data["total_replies"] == 2
        assert data["by_type"]["note"] == 2
        assert data["by_type"]["question"] == 1
        assert data["by_type"]["highlight"] == 1
        assert data["resolved"] == 1
        assert data["unresolved"] == 3
        assert len(data["top_contributors"]) == 1
        assert data["top_contributors"][0]["author"] == "demo_user"
        assert data["top_contributors"][0]["count"] == 4
    
    def test_embed_validation(self):
        """Test embed parameter validation."""
        # Create a shared chart
        create_response = client.post(
            "/api/chart-sharing/share",
            json={
                "config": {"type": "line", "data": [], "title": "Test"},
                "options": {"title": "Validation Test"}
            }
        )
        
        share_id = create_response.json()["share_id"]
        
        # Test invalid width (too large)
        response = client.get(
            f"/api/chart-sharing/embed/{share_id}",
            params={"width": 3000}
        )
        assert response.status_code == 422
        
        # Test invalid theme
        response = client.get(
            f"/api/chart-sharing/embed/{share_id}",
            params={"theme": "invalid"}
        )
        assert response.status_code == 422
        
        # Test valid parameters
        response = client.get(
            f"/api/chart-sharing/embed/{share_id}",
            params={
                "width": 1200,
                "height": 800,
                "theme": "dark",
                "interactive": True,
                "controls": False
            }
        )
        assert response.status_code == 200
    
    def test_annotation_authorization(self):
        """Test annotation authorization (mock test since we don't have real auth)."""
        chart_id = "test-auth-chart"
        
        # Create annotation
        create_response = client.post(
            f"/api/chart-sharing/annotations/{chart_id}",
            json={
                "x": 10,
                "y": 20,
                "text": "Test annotation",
                "type": "note"
            }
        )
        
        annotation_id = create_response.json()["id"]
        
        # In a real implementation, this would test with different users
        # For now, we just verify the endpoints work with the mock user
        
        # Update should work (same user)
        response = client.put(
            f"/api/chart-sharing/annotations/{chart_id}/{annotation_id}",
            json={"text": "Updated text"}
        )
        assert response.status_code == 200
        
        # Delete should work (same user)
        response = client.delete(
            f"/api/chart-sharing/annotations/{chart_id}/{annotation_id}"
        )
        assert response.status_code == 200
    
    def test_pagination(self):
        """Test pagination for user shared charts."""
        # Create many shared charts
        for i in range(15):
            client.post(
                "/api/chart-sharing/share",
                json={
                    "config": {"type": "line", "data": [], "title": f"Chart {i}"},
                    "options": {"title": f"Paginated Chart {i}"}
                }
            )
        
        # Test first page
        response = client.get("/api/chart-sharing/my-shares?limit=5&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
        
        # Test second page
        response = client.get("/api/chart-sharing/my-shares?limit=5&offset=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
        
        # Test last page
        response = client.get("/api/chart-sharing/my-shares?limit=5&offset=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
        
        # Test beyond available data
        response = client.get("/api/chart-sharing/my-shares?limit=5&offset=20")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

if __name__ == "__main__":
    pytest.main([__file__, "-v"])